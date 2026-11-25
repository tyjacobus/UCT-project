/* Path-sum explorer: enumerates the Hadamard paths of a small circuit over G = {H, X, CNOT, TOF},
 * using exactly the procedure Follow of Definition 8.2, and (in "pairs" mode) runs the PP machine
 * of Theorem 9.1 by brute force.
 * Usage: <div class="explorer" data-mode="paths|pairs" data-preset="hh"></div>
 */
(function () {
  "use strict";
  var PRESETS = {
    h:       { name: "H, then measure",                                   m: 1, code: "H 1" },
    hh:      { name: "H twice: cancellation (Examples 5.4, 8.5)",         m: 1, code: "H 1\nH 1" },
    bell:    { name: "Bell state (Example 4.9)",                          m: 2, code: "H 1\nCNOT 1 2" },
    which:   { name: "Which-path information (Example 5.5)",              m: 2, code: "H 1\nCNOT 1 2\nH 1" },
    deutsch: { name: "Deutsch's algorithm, f(x)=x (qubit 1 = ancilla)",   m: 2, code: "X 1\nH 1\nH 2\nCNOT 2 1\nH 2" },
    hzh:     { name: "H Z H with Z written as H X H (16 paths)",          m: 1, code: "H 1\nH 1\nX 1\nH 1\nH 1" },
    tof:     { name: "Hadamards around a Toffoli (p = 3/4)",               m: 3, code: "H 1\nH 2\nTOF 1 2 3\nX 3\nH 1\nH 2" }
  };
  var MAX_H = 10, MAX_M = 8;

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function frac(num, den) {
    if (num === 0) return "0";
    var g = gcd(num, den); num /= g; den /= g;
    return den === 1 ? String(num) : (num < 0 ? "\u2212" : "") + Math.abs(num) + "/" + den;
  }
  function sgn(s) { return s.replace(/^-/, "\u2212"); }
  // amplitude A / 2^{h/2}, shown exactly
  function ampStr(A, h) {
    if (A === 0) return "0";
    var k = Math.floor(h / 2), d = Math.pow(2, k), n = Math.abs(A), g = gcd(n, d);
    n /= g; d /= g;
    var neg = A < 0 ? "\u2212" : "";
    if (h % 2 === 0) return neg + (d === 1 ? n : n + "/" + d);
    return neg + n + "/" + (d === 1 ? "\u221a2" : "(" + d + "\u221a2)");
  }
  function bits(v, len) { var s = ""; for (var i = len - 1; i >= 0; i--) s += (v >> i) & 1; return s; }

  function parse(code, mHint) {
    var gates = [], maxQ = 0, errs = [];
    code.split(/[\n;]+/).forEach(function (line, li) {
      line = line.replace(/#.*$/, "").trim();
      if (!line) return;
      var tok = line.split(/[\s,()]+/).filter(Boolean);
      var name = tok[0].toUpperCase();
      var qs = tok.slice(1).map(Number);
      if (qs.some(function (q) { return !(q >= 1) || Math.floor(q) !== q; })) { errs.push("Line \u201c" + line + "\u201d: qubits are numbered 1, 2, 3, \u2026"); return; }
      var need = { H: 1, X: 1, CNOT: 2, CX: 2, TOF: 3, TOFFOLI: 3, CCX: 3 }[name];
      if (!need) {
        errs.push("Line \u201c" + line + "\u201d: unknown gate. Allowed: H, X, CNOT (or CX), TOF (or CCX)." + (name === "Z" ? " (Z is not in \ud835\udca2; write it as H, X, H.)" : ""));
        return;
      }
      if (qs.length !== need) { errs.push("Line \u201c" + line + "\u201d: " + name + " takes " + need + " qubit(s)."); return; }
      if (new Set(qs).size !== qs.length) { errs.push("Line \u201c" + line + "\u201d: the qubits of a gate must be distinct."); return; }
      if (name === "CX") name = "CNOT";
      if (name === "CCX" || name === "TOFFOLI") name = "TOF";
      qs.forEach(function (q) { maxQ = Math.max(maxQ, q); });
      gates.push({ t: name, q: qs });
    });
    var m = Math.max(mHint || 1, maxQ, 1);
    var h = gates.filter(function (g) { return g.t === "H"; }).length;
    if (m > MAX_M) errs.push("At most " + MAX_M + " qubits, please.");
    if (h > MAX_H) errs.push("At most " + MAX_H + " Hadamard gates, please (there are 2^h paths and 4^h pairs).");
    return { gates: gates, m: m, h: h, errs: errs };
  }

  // Definition 8.2 (Follow), literally.
  function follow(C, z, b) {
    var m = C.m, h = C.h, w = z, phi = 0, i = 0;
    var bit = function (v, j) { return (v >> (m - j)) & 1; };
    var mask = function (j) { return 1 << (m - j); };
    C.gates.forEach(function (g) {
      if (g.t === "X") w ^= mask(g.q[0]);
      else if (g.t === "CNOT") { if (bit(w, g.q[0])) w ^= mask(g.q[1]); }
      else if (g.t === "TOF") { if (bit(w, g.q[0]) && bit(w, g.q[1])) w ^= mask(g.q[2]); }
      else if (g.t === "H") {
        var bi = (b >> (h - 1 - i)) & 1, j = g.q[0];
        phi ^= bit(w, j) & bi;
        w = bi ? (w | mask(j)) : (w & ~mask(j));
        i++;
      }
    });
    return [w, phi];
  }
  // Schrödinger-style simulation, for the cross-check
  function simulate(C, z) {
    var m = C.m, N = 1 << m, v = new Float64Array(N);
    v[z] = 1;
    var mask = function (j) { return 1 << (m - j); };
    C.gates.forEach(function (g) {
      var nv = new Float64Array(N);
      for (var s = 0; s < N; s++) {
        if (!v[s]) continue;
        if (g.t === "H") {
          var mk = mask(g.q[0]), a = (s & mk) ? 1 : 0, r = Math.SQRT1_2;
          nv[s & ~mk] += r * v[s];
          nv[s | mk] += (a ? -r : r) * v[s];
        } else {
          var t = s;
          if (g.t === "X") t ^= mask(g.q[0]);
          else if (g.t === "CNOT") { if (s & mask(g.q[0])) t ^= mask(g.q[1]); }
          else if (g.t === "TOF") { if ((s & mask(g.q[0])) && (s & mask(g.q[1]))) t ^= mask(g.q[2]); }
          nv[t] += v[s];
        }
      }
      v = nv;
    });
    return v;
  }

  function build(root) {
    var mode = root.getAttribute("data-mode") || "paths";
    var preset = root.getAttribute("data-preset") || "hh";
    var opts = Object.keys(PRESETS).map(function (k) {
      return '<option value="' + k + '"' + (k === preset ? " selected" : "") + ">" + PRESETS[k].name + "</option>";
    }).join("") + '<option value="custom">Custom (edit the gates below)</option>';
    root.innerHTML =
      "<h4>" + (mode === "pairs" ? "Path-sum explorer: the PP machine at work" : "Path-sum explorer") + "</h4>" +
      '<p class="small" style="margin:0 0 8px">Pick a circuit or type your own (one gate per line: <code>H j</code>, <code>X j</code>, <code>CNOT c t</code>, <code>TOF c1 c2 t</code>; qubits numbered from 1). ' +
      "The explorer runs <strong>Follow</strong> (Definition 8.2) on every $b\\in\\{0,1\\}^h$" + (mode === "pairs" ? ", then runs the $\\mathsf{PP}$ machine of Theorem 9.1 on all $2\\cdot4^h$ coin sequences" : "") + ".</p>" +
      '<div class="controls">' +
      '<label>Circuit<select class="ex-preset">' + opts + "</select></label>" +
      '<label>Qubits (<i>m</i>)<input class="ex-m" type="number" min="1" max="' + MAX_M + '" style="width:64px"></label>' +
      '<label>Start state <i>z</i><input class="ex-z" type="text" style="width:110px" spellcheck="false"></label>' +
      '<button class="ex-run" type="button">Run</button></div>' +
      '<textarea class="ex-code" spellcheck="false" aria-label="circuit gates"></textarea>' +
      '<div class="ex-err err"></div><div class="ex-fig"></div><div class="ex-out"></div>';
    var sel = root.querySelector(".ex-preset"), mIn = root.querySelector(".ex-m"), zIn = root.querySelector(".ex-z"),
        code = root.querySelector(".ex-code"), out = root.querySelector(".ex-out"), err = root.querySelector(".ex-err"),
        figBox = root.querySelector(".ex-fig");
    function loadPreset(k) {
      var p = PRESETS[k]; if (!p) return;
      code.value = p.code; mIn.value = p.m; zIn.value = "0".repeat(p.m);
    }
    sel.addEventListener("change", function () { if (sel.value !== "custom") { loadPreset(sel.value); run(); } });
    code.addEventListener("input", function () { sel.value = "custom"; });
    root.querySelector(".ex-run").addEventListener("click", run);
    loadPreset(preset);

    function run() {
      err.textContent = ""; out.innerHTML = ""; figBox.innerHTML = "";
      var C = parse(code.value, +mIn.value || 1);
      if (C.m !== +mIn.value) mIn.value = C.m;
      var zs = (zIn.value || "").replace(/\s/g, "");
      if (zs.length < C.m) zs = zs + "0".repeat(C.m - zs.length);
      if (zs.length > C.m) zs = zs.slice(0, C.m);
      if (!/^[01]*$/.test(zs)) C.errs.push("The start state must be a string of 0s and 1s.");
      zIn.value = zs;
      if (C.errs.length) { err.innerHTML = C.errs.join("<br>"); return; }
      if (!C.gates.length) { err.textContent = "Add at least one gate."; return; }
      var m = C.m, h = C.h, z = parseInt(zs, 2), nb = 1 << h;

      // circuit picture
      if (window.QSite) {
        var f = document.createElement("figure");
        f.className = "circuit";
        f.setAttribute("data-wires", zs.split("").map(function (c) { return "|" + c + "\u27e9"; }).join(";"));
        var cols = C.gates.map(function (g) {
          var q = g.q.map(function (x) { return x - 1; });
          return (g.t === "H" ? "H " : g.t === "X" ? "X " : g.t + " ") + q.join(" ");
        });
        cols.push("M " + (m - 1));
        f.setAttribute("data-gates", cols.join(", "));
        figBox.appendChild(f);
        window.QSite.drawCircuit(f);
      }

      // all paths
      var W = new Int32Array(nb), P = new Int8Array(nb);
      for (var b = 0; b < nb; b++) { var r = follow(C, z, b); W[b] = r[0]; P[b] = r[1]; }
      var groups = {};
      for (b = 0; b < nb; b++) { (groups[W[b]] = groups[W[b]] || []).push(b); }
      var ys = Object.keys(groups).map(Number).sort(function (a, c) { return a - c; });
      var vec = simulate(C, z);

      var html = "";
      // path table
      var rows = "";
      ys.forEach(function (y) {
        groups[y].forEach(function (bb, k) {
          var neg = P[bb] === 1;
          rows += "<tr>" + '<td class="c">' + (h ? bits(bb, h) : "(empty)") + "</td>" +
            '<td class="c">' + bits(y, m) + "</td>" +
            '<td class="c">' + P[bb] + "</td>" +
            '<td class="c ' + (neg ? "neg" : "pos") + '">' + (neg ? "\u2212" : "+") + "</td></tr>";
        });
      });
      var pathTable = '<div class="scroll"><table><tr><th class="c">$b$ (Hadamard choices)</th><th class="c">endpoint $w$</th><th class="c">$\\varphi$</th><th class="c">sign $(-1)^{\\varphi}$</th></tr>' + rows + "</table></div>";

      // amplitudes
      var arows = "", pNum = 0, maxErr = 0;
      ys.forEach(function (y) {
        var plus = 0, minus = 0;
        groups[y].forEach(function (bb) { if (P[bb]) minus++; else plus++; });
        var A = plus - minus;
        var exact = A / Math.pow(2, h / 2);
        maxErr = Math.max(maxErr, Math.abs(exact - vec[y]));
        if ((y & 1) === 1) pNum += A * A;
        var cancel = plus && minus;
        arows += "<tr><td class='c'>" + bits(y, m) + "</td><td class='c pos'>" + plus + "</td><td class='c neg'>" + minus + "</td><td class='c'>" + sgn(String(A)) +
          "</td><td class='c'>" + ampStr(A, h) + "</td><td class='c'>" + frac(A * A, Math.pow(2, h)) + "</td><td>" +
          (cancel ? (A === 0 ? "<span class='neg'>complete cancellation</span>" : "partial cancellation") : "") + "</td></tr>";
      });
      for (var s = 0; s < (1 << m); s++) if (!groups[s]) maxErr = Math.max(maxErr, Math.abs(vec[s]));
      var ampTable = "<div class='table-wrap'><table><tr><th class='c'>$y$</th><th class='c'># paths $+$</th><th class='c'># paths $-$</th><th class='c'>$A_y$</th><th class='c'>$\\langle y|C|z\\rangle = A_y/2^{h/2}$</th><th class='c'>$|\\langle y|C|z\\rangle|^2$</th><th></th></tr>" + arows + "</table></div>";
      var pStr = frac(pNum, Math.pow(2, h));
      var check = maxErr < 1e-9 ? "<span class='pos'>\u2713 matches</span> a direct (Schr\u00f6dinger-style) simulation of the $2^m$-dimensional state vector."
                                : "<span class='neg'>mismatch with direct simulation (max error " + maxErr.toExponential(2) + ")</span>";

      var summary = "<div class='summary'><div>$m = " + m + "$ qubits, $T = " + C.gates.length + "$ gates, $h = " + h + "$ Hadamards, so $2^h = " + nb + "$ paths.</div>" +
        "<div>Strings $y$ never reached by any path have amplitude $0$ and are not listed. Endpoints reached: " + ys.length + " of " + (1 << m) + ".</div>" +
        "<div><strong>Acceptance probability</strong> (last qubit reads 1): $p = \\sum_{y_m=1}A_y^2/2^h = " + pStr.replace("\u2212", "-") + "$.</div>" +
        "<div>Cross-check: " + check + "</div></div>";

      if (mode === "paths") {
        html += summary +
          "<div class='panel'><h5>Amplitudes: paths grouped by endpoint (Corollary 8.4)</h5>" + ampTable + "</div>" +
          "<div class='panel'><h5>All $2^h$ paths, as computed by Follow</h5>" + pathTable + "</div>";
      } else {
        // pairs: the PP machine, by brute force
        var plusP = 0, minusP = 0, zeroP = 0, sameEnd = 0, acc = 0;
        for (var b1 = 0; b1 < nb; b1++) for (var b2 = 0; b2 < nb; b2++) {
          if (W[b1] !== W[b2]) { zeroP++; acc += 1; continue; } // abstain: accept on c=0 only
          sameEnd++;
          var e = P[b1] ^ P[b2] ^ 1 ^ (W[b1] & 1);
          if (e === 0) { plusP++; acc += 2; } else { minusP++; }
        }
        var total = 2 * nb * nb, g = plusP - minusP;
        var formula = frac(g, 2 * nb * nb); // (2p-1)/2^{h+1} = g/2^{2h+1}
        html += summary +
          "<div class='panel'><h5>Pairs of paths (Lemma 9.3)</h5><div class='summary'>" +
          "<div>All pairs $(b,b')$: $4^h = " + nb * nb + "$. Pairs with different endpoints (contribute $0$): <strong>" + zeroP + "</strong>.</div>" +
          "<div>Pairs with the same endpoint: " + sameEnd + ", of which <span class='pos'>" + plusP + " have value $+1$</span> and <span class='neg'>" + minusP + " have value $-1$</span>.</div>" +
          "<div>Signed total $f(z) = \\sum_{b,b'} v(b,b') = " + sgn(String(g)) + "$, and indeed $2^h(2p-1) = " + sgn(String(2 * pNum - nb)) + "$.</div></div></div>" +
          "<div class='panel'><h5>The PP machine $M$ (proof of Theorem 9.1), run on all $2\\cdot 4^h = " + total + "$ coin sequences</h5><div class='summary'>" +
          "<div>Accepting coin sequences: " + acc + " of " + total + ", so $\\Pr[M\\text{ accepts}] = " + frac(acc, total) + "$.</div>" +
          "<div>Formula from the proof: $\\tfrac12 + \\dfrac{2p-1}{2^{h+1}} = \\tfrac12 + (" + formula.replace("\u2212", "-") + ") = " + frac(nb * nb + g, total) + "$ " + (acc * 1 === nb * nb + g ? "<span class='pos'>\u2713</span>" : "<span class='neg'>\u2717</span>") + "</div>" +
          "<div>$M$ accepts with probability $>\\tfrac12$ exactly when $p>\\tfrac12$: here $p " + (2 * pNum > Math.pow(2, h) ? ">" : 2 * pNum === Math.pow(2, h) ? "=" : "<") + " \\tfrac12$ and $\\Pr[M] " +
          (2 * acc > total ? ">" : 2 * acc === total ? "=" : "<") + " \\tfrac12$. The bias is shrunk by a factor of $2^{h+1}$, but its sign survives.</div></div></div>" +
          "<details class='panel'><summary>Show the individual paths and amplitudes</summary>" + ampTable + pathTable + "</details>";
      }
      out.innerHTML = html;
      if (window.QSite) window.QSite.renderMath(root);
    }
    if (window.QSite) window.QSite.renderMath(root.querySelector("p"));
    if (window.QSite) window.QSite.renderMath(root.querySelector(".controls"));
    run();
  }
  function init() { document.querySelectorAll(".explorer").forEach(build); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
