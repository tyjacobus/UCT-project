/* Quantum Computation: A Complexity Theory View — shared site script.
 *  - builds the roadmap sidebar, per-page table of contents and prev/next links
 *  - renders math with KaTeX (vendored in assets/katex)
 *  - draws quantum-circuit diagrams from <figure class="circuit" data-wires=... data-gates=...>
 *  - shows hover previews for links that point at a definition/theorem box (on any page)
 */
(function () {
  "use strict";

  // ------------------------------------------------------------------
  // Site map (single source of truth for navigation). Edit here to add/rename chapters.
  // ------------------------------------------------------------------
  var SCRIBE = "";   // optional byline for each chapter banner (e.g. "Scribe: ..."); empty = none
  var PAGES = [
    { file: "index.html",        title: "Overview and Roadmap" },
    { file: "intro.html",        title: "Why Quantum Complexity?" },
    { file: "background.html",   title: "Background Review" },
    { file: "states.html",       title: "Qubits and Quantum States" },
    { file: "gates.html",        title: "Unitary Gates and Circuits" },
    { file: "interference.html", title: "Quantum vs. Randomized Computation" },
    { file: "bqp.html",          title: "BQP and Reversible Computation" },
    { file: "pspace.html",       title: "BQP ⊆ PSPACE" },
    { file: "pp.html",           title: "The Main Theorem: BQP ⊆ PP" },
    { file: "conclusion.html",   title: "Conclusion and References" },
    { file: "glossary.html",     title: "Index of Definitions" }
  ];
  var ICON = '<svg width="18" height="16" viewBox="0 0 36 32" fill="currentColor" aria-hidden="true"><path d="M11 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm-1.5 2C5.4 11 2 14.4 2 18.5V23h3v8h10v-8.6l6.3-6.3a2 2 0 0 0-2.8-2.8L13 18.8V11h-3.5zM14 1v3h18v17H19l-3 3h19V1H14zm8 15h7v-3h-7v3z"/></svg>';

  function currentFile() {
    var p = location.pathname.split("/").pop();
    return p === "" ? "index.html" : p;
  }
  var CUR = currentFile();
  var curIdx = PAGES.findIndex(function (p) { return p.file === CUR; });

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }
  function slug(s) {
    return s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  }

  // ------------------------------------------------------------------
  // Layout: top bar + chapter sidebar (current chapter expands to its sections) + banner + pager
  // ------------------------------------------------------------------
  function buildLayout() {
    var main = document.querySelector("main");
    if (!main) return;
    var content = main.querySelector(".content") || main;

    var bar = el("header", { id: "topbar" },
      '<button id="menu-btn" aria-label="Open chapters">☰</button>' +
      '<a href="index.html" class="logo" title="Overview">Q</a>' +
      '<a href="index.html" class="brand">Quantum Complexity</a>' +
      '<a class="nav hide-sm" href="index.html">Notes</a>' +
      '<a class="nav hide-sm" href="glossary.html">Definitions</a>' +
      '<a class="nav hide-sm" href="conclusion.html#references">References</a><span class="spacer"></span>');
    document.body.insertBefore(bar, document.body.firstChild);
    bar.querySelector("#menu-btn").addEventListener("click", function () { document.body.classList.toggle("nav-open"); });

    var layout = el("div", { class: "layout" });
    main.parentNode.insertBefore(layout, main);
    var side = el("nav", { id: "sidebar", "aria-label": "Chapters" });
    layout.appendChild(side);
    layout.appendChild(main);
    main.addEventListener("click", function () { document.body.classList.remove("nav-open"); });

    // number the sections of this chapter (CSS shows the numbers; we need them for the sidebar)
    var heads = content.querySelectorAll("h2:not(.nonum)");
    var html = '<div class="side-head">' + ICON + "Scribe Notes</div><ul>";
    PAGES.forEach(function (p, i) {
      html += '<li class="chap' + (i === curIdx ? " current" : "") + '"><a href="' + p.file + '">' + ICON + "<span>" + p.title + "</span></a>";
      if (i === curIdx && heads.length) html += '<ul class="secs" id="secs"></ul>';
      html += "</li>";
    });
    html += '</ul><div class="side-foot"><a href="glossary.html">Index of definitions</a><a href="glossary.html#notation">Notation table</a><a href="pp.html#thm-main">Jump to the main theorem</a></div>';
    side.innerHTML = html;
    var secs = document.getElementById("secs");
    if (secs) {
      heads.forEach(function (hd, i) {
        if (!hd.id) hd.id = slug(hd.textContent);
        var a = el("a", { href: "#" + hd.id }, '<span class="n">' + (i + 1) + "</span><span>" + hd.innerHTML + "</span>");
        var li = el("li"); li.appendChild(a); secs.appendChild(li);
      });
      var links = secs.querySelectorAll("a");
      var spy = function () {
        var y = window.scrollY + 120, active = 0;
        heads.forEach(function (hd, i) { if (hd.getBoundingClientRect().top + window.scrollY <= y) active = i; });
        links.forEach(function (a, i) { a.classList.toggle("active", i === active); });
      };
      window.addEventListener("scroll", spy, { passive: true });
      spy();
    }

    // chapter banner: icon + "Scribe:" line
    var banner = content.querySelector(".chapter-banner");
    if (banner) {
      banner.insertAdjacentHTML("afterbegin", ICON.replace('width="18" height="16"', 'width="58" height="52"'));
      if (SCRIBE && !banner.querySelector(".byline")) banner.insertAdjacentHTML("beforeend", '<div class="byline">Scribe: ' + SCRIBE + "</div>");
    }

    // right-hand tools
    var tools = el("div", { id: "rtools" }, '<a id="expand-all">&#8964;&nbsp; Expand all</a><a href="glossary.html">Definitions</a>');
    document.body.appendChild(tools);

    // pager
    var pager = el("nav", { class: "pager", "aria-label": "Previous and next chapter" });
    if (curIdx > 0) {
      var pv = PAGES[curIdx - 1];
      pager.appendChild(el("a", { class: "prev", href: pv.file }, '<span class="dir">&larr; Previous chapter</span>' + pv.title));
    }
    if (curIdx >= 0 && curIdx < PAGES.length - 1) {
      var nx = PAGES[curIdx + 1];
      pager.appendChild(el("a", { class: "next", href: nx.file }, '<span class="dir">Next chapter &rarr;</span>' + nx.title));
    }
    content.appendChild(pager);
    content.appendChild(el("footer", { class: "site-foot" },
      "Quantum Computation: A Complexity Theory View &middot; a CS455 (CMU Undergraduate Complexity Theory) project. " +
      'Sources for every result are listed under <a href="conclusion.html#references">References</a>.'));

    // make each box label a self-link
    content.querySelectorAll(".box[id] > .box-title .label").forEach(function (lab) {
      var box = lab.closest(".box");
      var a = el("a", { href: "#" + box.id, title: "Link to this block", style: "color:inherit;text-decoration:none" });
      lab.parentNode.insertBefore(a, lab);
      a.appendChild(lab);
    });
  }

  // ------------------------------------------------------------------
  // Collapsible proofs and solutions (collapsed by default, like the course notes)
  // ------------------------------------------------------------------
  function setupProofs() {
    var proofs = document.querySelectorAll(".content .proof");
    proofs.forEach(function (pf) {
      var lab = pf.querySelector(":scope > .proof-label");
      var text = pf.getAttribute("data-label") || (lab ? lab.textContent.replace(/[.:]\s*$/, "") : "Proof");
      if (lab) lab.remove();
      var body = el("div", { class: "proof-body" });
      while (pf.firstChild) body.appendChild(pf.firstChild);
      var btn = el("button", { class: "proof-toggle", type: "button", "aria-expanded": "false" }, text);
      pf.appendChild(btn); pf.appendChild(body);
      pf.classList.add("collapsed");
      btn.addEventListener("click", function () {
        pf.classList.toggle("collapsed");
        btn.setAttribute("aria-expanded", String(!pf.classList.contains("collapsed")));
      });
    });
    var ea = document.getElementById("expand-all");
    if (ea) {
      if (!proofs.length) { ea.style.display = "none"; return; }
      ea.addEventListener("click", function () {
        var anyCollapsed = document.querySelector(".content .proof.collapsed");
        document.querySelectorAll(".content .proof").forEach(function (pf) { pf.classList.toggle("collapsed", !anyCollapsed); });
        ea.innerHTML = anyCollapsed ? "&#8963;&nbsp; Collapse all" : "&#8964;&nbsp; Expand all";
      });
    }
    // open a proof if the URL points inside it
    var openFor = function () {
      if (!location.hash) return;
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      var pf = t && t.closest && t.closest(".proof");
      if (pf) pf.classList.remove("collapsed");
    };
    openFor();
    window.addEventListener("hashchange", openFor);
  }

  // ------------------------------------------------------------------
  // KaTeX
  // ------------------------------------------------------------------
  var MACROS = {
    "\\ket": "\\left|#1\\right\\rangle",
    "\\bra": "\\left\\langle #1\\right|",
    "\\braket": "\\left\\langle #1\\middle|#2\\right\\rangle",
    "\\amp": "\\left\\langle #1\\middle|#2\\middle|#3\\right\\rangle",
    "\\C": "\\mathbb{C}",
    "\\R": "\\mathbb{R}",
    "\\Z": "\\mathbb{Z}",
    "\\cG": "\\mathcal{G}",
    "\\poly": "\\mathrm{poly}",
    "\\Pr": "\\mathop{\\mathbf{Pr}}",
    "\\CNOT": "\\mathrm{CNOT}",
    "\\TOF": "\\mathrm{TOF}",
    "\\Follow": "\\textsc{Follow}"
  };
  function renderMath(root) {
    if (window.renderMathInElement) {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "$", right: "$", display: false }
        ],
        macros: MACROS,
        throwOnError: false,
        ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option"],
        ignoredClasses: ["no-math"]
      });
    }
  }

  // ------------------------------------------------------------------
  // Circuit diagrams
  //   data-wires = "label;label;..."        (top to bottom)
  //   data-gates = "col, col, ..."  where col = "op + op + ..."
  //   ops:  H i | X i | Z i | S i | G label i | CNOT c t | TOF c1 c2 t |
  //         BOX label lo hi | M i | SLICE label | GAP
  //   data-out  = "label;label;..."         (optional right-hand labels)
  //   label syntax: base_sub^sup ; use ~ for a space
  // ------------------------------------------------------------------
  function svgLabel(x, y, s, size, anchor) {
    // label mini-syntax: a_b, a^b, a_{bc}, a^{bc}; ~ is a space
    s = String(s).replace(/~/g, " ");
    size = size || 16;
    var parts = [], buf = "", i = 0;
    while (i < s.length) {
      var ch = s[i];
      if ((ch === "_" || ch === "^") && i + 1 < s.length) {
        if (buf) { parts.push({ t: buf, m: 0 }); buf = ""; }
        var txt;
        if (s[i + 1] === "{") { var k = s.indexOf("}", i + 2); if (k < 0) k = s.length; txt = s.slice(i + 2, k); i = k + 1; }
        else { txt = s[i + 1]; i += 2; }
        parts.push({ t: txt, m: ch === "_" ? 1 : -1 });
        continue;
      }
      buf += ch; i++;
    }
    if (buf) parts.push({ t: buf, m: 0 });
    var small = Math.round(size * 0.68), off = 0;
    var out = '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || "middle") + '" dominant-baseline="central" font-size="' + size + '" fill="currentColor" font-family="KaTeX_Main, Georgia, serif">';
    parts.forEach(function (p) {
      var target = p.m === 1 ? 5 : p.m === -1 ? -7 : 0;
      var dy = target - off; off = target;
      out += '<tspan' + (dy ? ' dy="' + dy + '"' : "") + (p.m ? ' font-size="' + small + '"' : "") + ">" + escapeXml(p.t) + "</tspan>";
    });
    return out + "</text>";
  }
  function labelLen(s) { return String(s).replace(/[_^~{}]/g, "").length; }
  function escapeXml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function tokenize(s) {
    var out = [], re = /"([^"]*)"|'([^']*)'|(\S+)/g, m;
    while ((m = re.exec(s))) out.push(m[1] != null ? m[1] : m[2] != null ? m[2] : m[3]);
    return out;
  }
  function drawCircuit(fig) {
    var wires = (fig.getAttribute("data-wires") || "").split(";");
    var outs = fig.hasAttribute("data-out") ? fig.getAttribute("data-out").split(";") : null;
    var cols = (fig.getAttribute("data-gates") || "").split(",").map(function (c) {
      return c.split("+").map(function (o) { return tokenize(o.trim()); }).filter(function (t) { return t.length; });
    });
    var n = wires.length, gap = 46, colW = 60, top = 26;
    var maxL = Math.max.apply(null, wires.map(labelLen));
    var left = 14 + maxL * 8.5 + 14;
    var maxR = outs ? Math.max.apply(null, outs.map(labelLen)) : 0;
    var right = outs ? 14 + maxR * 8.5 + 10 : 16;
    var hasSlice = cols.some(function (c) { return c.some(function (o) { return o[0] === "SLICE"; }); });
    var W = left + cols.length * colW + right;
    var H = top + (n - 1) * gap + (hasSlice ? 44 : 22);
    var Y = function (i) { return top + i * gap; };
    var g = [];
    var measured = {};
    // wires
    for (var i = 0; i < n; i++) {
      g.push(svgLabel(left - 12, Y(i), wires[i], 16, "end"));
      if (outs && outs[i]) g.push(svgLabel(W - right + 10, Y(i), outs[i], 16, "start"));
    }
    var wireSegs = [];
    cols.forEach(function (col, ci) {
      var x = left + ci * colW + colW / 2;
      col.forEach(function (op) {
        var k = op[0].toUpperCase();
        var box = function (lab, yc, h) {
          h = h || 34;
          var w = Math.max(34, labelLen(lab) * 9 + 14);
          g.push('<rect x="' + (x - w / 2) + '" y="' + (yc - h / 2) + '" width="' + w + '" height="' + h + '" rx="3" style="fill:var(--bg);stroke:currentColor" stroke-width="1.3"/>');
          g.push(svgLabel(x, yc, lab, 16));
        };
        if (k === "H" || k === "X" || k === "Z" || k === "S" || k === "T") box(k, Y(+op[1]));
        else if (k === "G") box(op[1], Y(+op[2]));
        else if (k === "BOX") {
          var lo = +op[2], hi = +op[3];
          box(op[1], (Y(lo) + Y(hi)) / 2, Y(hi) - Y(lo) + 34);
        } else if (k === "CNOT" || k === "TOF") {
          var ctr = op.slice(1, -1).map(Number), t = +op[op.length - 1];
          var ys = ctr.map(Y).concat([Y(t)]);
          var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
          var tY = Y(t);
          var e0 = y0 === tY ? y0 - 11 : y0, e1 = y1 === tY ? y1 + 11 : y1;
          g.push('<line x1="' + x + '" y1="' + e0 + '" x2="' + x + '" y2="' + e1 + '" stroke="currentColor" stroke-width="1.3"/>');
          ctr.forEach(function (c) { g.push('<circle cx="' + x + '" cy="' + Y(c) + '" r="4.5" fill="currentColor"/>'); });
          g.push('<circle cx="' + x + '" cy="' + tY + '" r="11" style="fill:var(--bg);stroke:currentColor" stroke-width="1.3"/>');
          g.push('<line x1="' + (x - 11) + '" y1="' + tY + '" x2="' + (x + 11) + '" y2="' + tY + '" stroke="currentColor" stroke-width="1.3"/>');
          g.push('<line x1="' + x + '" y1="' + (tY - 11) + '" x2="' + x + '" y2="' + (tY + 11) + '" stroke="currentColor" stroke-width="1.3"/>');
        } else if (k === "M") {
          var yc = Y(+op[1]);
          measured[+op[1]] = x;
          g.push('<rect x="' + (x - 18) + '" y="' + (yc - 15) + '" width="36" height="30" rx="3" style="fill:var(--bg);stroke:currentColor" stroke-width="1.3"/>');
          g.push('<path d="M ' + (x - 11) + " " + (yc + 6) + " A 11 11 0 0 1 " + (x + 11) + " " + (yc + 6) + '" fill="none" stroke="currentColor" stroke-width="1.2"/>');
          g.push('<line x1="' + x + '" y1="' + (yc + 6) + '" x2="' + (x + 8) + '" y2="' + (yc - 9) + '" stroke="currentColor" stroke-width="1.2"/>');
        } else if (k === "SLICE") {
          var xs = x;
          g.push('<line x1="' + xs + '" y1="' + (top - 18) + '" x2="' + xs + '" y2="' + (Y(n - 1) + 18) + '" stroke="var(--accent)" stroke-dasharray="4 4" stroke-width="1.2"/>');
          g.push(svgLabel(xs, Y(n - 1) + 32, op[1] || "", 14));
        }
      });
    });
    // wires drawn first (behind gates); measured wires become double lines after the meter
    for (var j = 0; j < n; j++) {
      var xEnd = W - right;
      if (measured[j] != null) {
        wireSegs.push('<line x1="' + left + '" y1="' + Y(j) + '" x2="' + measured[j] + '" y2="' + Y(j) + '" stroke="currentColor" stroke-width="1.2"/>');
        wireSegs.push('<line x1="' + (measured[j] + 18) + '" y1="' + (Y(j) - 2) + '" x2="' + xEnd + '" y2="' + (Y(j) - 2) + '" stroke="currentColor" stroke-width="1"/>');
        wireSegs.push('<line x1="' + (measured[j] + 18) + '" y1="' + (Y(j) + 2) + '" x2="' + xEnd + '" y2="' + (Y(j) + 2) + '" stroke="currentColor" stroke-width="1"/>');
      } else {
        wireSegs.push('<line x1="' + left + '" y1="' + Y(j) + '" x2="' + xEnd + '" y2="' + Y(j) + '" stroke="currentColor" stroke-width="1.2"/>');
      }
    }
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="' +
      escapeXml(fig.getAttribute("data-alt") || "quantum circuit diagram") + '" style="color:var(--text)">' + wireSegs.join("") + g.join("") + "</svg>";
    var holder = el("div", { class: "circuit-svg" }, svg);
    fig.insertBefore(holder, fig.firstChild);
  }

  // ------------------------------------------------------------------
  // Hover previews of definitions / theorems (also across pages)
  // ------------------------------------------------------------------
  var docCache = {};
  function getDoc(file) {
    if (!docCache[file]) {
      docCache[file] = fetch(file).then(function (r) { if (!r.ok) throw 0; return r.text(); })
        .then(function (t) { return new DOMParser().parseFromString(t, "text/html"); });
    }
    return docCache[file];
  }
  function setupPreviews() {
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;
    var pv = el("div", { id: "preview", role: "tooltip" });
    document.body.appendChild(pv);
    var showT = null, hideT = null, curLink = null;
    function hide() { pv.style.display = "none"; curLink = null; }
    function place(a) {
      var r = a.getBoundingClientRect();
      var w = Math.min(520, window.innerWidth * 0.92);
      var leftPos = Math.max(8, Math.min(r.left + window.scrollX, window.scrollX + window.innerWidth - w - 16));
      pv.style.left = leftPos + "px";
      var below = r.bottom + window.scrollY + 6;
      pv.style.top = below + "px";
      pv.style.display = "block";
      var ph = pv.offsetHeight;
      if (r.bottom + ph + 12 > window.innerHeight && r.top - ph - 8 > 0) pv.style.top = (r.top + window.scrollY - ph - 6) + "px";
    }
    function show(a) {
      var url;
      try { url = new URL(a.getAttribute("href"), location.href); } catch (e) { return; }
      if (!url.hash || url.origin !== location.origin) return;
      var file = url.pathname.split("/").pop() || "index.html";
      var id = decodeURIComponent(url.hash.slice(1));
      var finish = function (node, fromFile) {
        if (!node || !(node.classList.contains("box") || node.hasAttribute("data-preview"))) return;
        if (curLink !== a) return;
        var clone = node.cloneNode(true);
        clone.removeAttribute("id");
        clone.querySelectorAll("[id]").forEach(function (x) { x.removeAttribute("id"); });
        clone.querySelectorAll(".circuit-svg").forEach(function (x) { x.remove(); });
        pv.innerHTML = "";
        if (fromFile) {
          var pg = PAGES.find(function (p) { return p.file === fromFile; });
          pv.appendChild(el("div", { class: "pv-src" }, "From the chapter \u201c" + (pg ? pg.title : fromFile) + "\u201d (click the link to go there)"));
        }
        if (node.tagName === "DT") {
          var dl = el("dl", { class: "gloss" });
          dl.appendChild(clone);
          var dd = node.nextElementSibling;
          if (dd) dl.appendChild(dd.cloneNode(true));
          pv.appendChild(dl);
        } else pv.appendChild(clone);
        clone.querySelectorAll("figure.circuit").forEach(drawCircuit);
        if (fromFile) renderMath(pv);
        place(a);
      };
      if (file === CUR) finish(document.getElementById(id), null);
      else getDoc(file).then(function (d) { finish(d.getElementById(id), file); }).catch(function () {});
    }
    document.addEventListener("mouseover", function (e) {
      var a = e.target.closest && e.target.closest("a[href*='#']");
      if (e.target.closest && e.target.closest("#preview")) { clearTimeout(hideT); return; }
      if (!a || a.closest("#sidebar") || a.closest("#topbar") || a.closest("#rtools") || a.closest(".pager") || a.closest(".box-title")) return;
      clearTimeout(hideT); clearTimeout(showT);
      curLink = a;
      showT = setTimeout(function () { show(a); }, 220);
    });
    document.addEventListener("mouseout", function (e) {
      var a = e.target.closest && (e.target.closest("a[href*='#']") || e.target.closest("#preview"));
      if (!a) return;
      clearTimeout(showT);
      hideT = setTimeout(hide, 260);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") hide(); });
    window.addEventListener("scroll", function () { if (pv.style.display === "block" && curLink) { /* keep */ } }, { passive: true });
  }

  // flash a box when navigating to it inside the page
  function setupFlash() {
    window.addEventListener("hashchange", function () {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t && t.classList.contains("box")) { t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash"); }
    });
  }

  function init() {
    buildLayout();
    setupProofs();
    document.querySelectorAll("figure.circuit").forEach(drawCircuit);
    renderMath(document.body);
    setupPreviews();
    setupFlash();
    // re-scroll to hash after math changed the layout
    if (location.hash) {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t) setTimeout(function () { t.scrollIntoView(); }, 30);
    }
    document.dispatchEvent(new Event("site-ready"));
  }
  window.QSite = { renderMath: renderMath, drawCircuit: drawCircuit, PAGES: PAGES };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
