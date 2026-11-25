/* Quantum Computation: A Complexity Theory View — shared site script.
 *  - builds the roadmap sidebar, per-page table of contents and prev/next links
 *  - renders math with KaTeX (vendored in assets/katex)
 *  - draws quantum-circuit diagrams from <figure class="circuit" data-wires=... data-gates=...>
 *  - shows hover previews for links that point at a definition/theorem box (on any page)
 */
(function () {
  "use strict";

  // ------------------------------------------------------------------
  // Site map (single source of truth for navigation)
  // ------------------------------------------------------------------
  var PAGES = [
    { file: "index.html",        num: "",   title: "Overview and Roadmap",               part: "Start here" },
    { file: "intro.html",        num: "1",  title: "Why Quantum Complexity?",            part: "Start here" },
    { file: "background.html",   num: "2",  title: "Background Review",                  part: "Start here" },
    { file: "states.html",       num: "3",  title: "Qubits and Quantum States",          part: "Lecture A: the model" },
    { file: "gates.html",        num: "4",  title: "Unitary Gates and Circuits",         part: "Lecture A: the model" },
    { file: "interference.html", num: "5",  title: "Quantum vs. Randomized Computation", part: "Lecture A: the model" },
    { file: "bqp.html",          num: "6",  title: "BQP and Reversible Computation",     part: "Lecture A: the model" },
    { file: "algorithms.html",   num: "7",  title: "Evidence of Power: Query Algorithms", part: "Lecture B: power and limits" },
    { file: "pspace.html",       num: "8",  title: "Warm-up: BQP ⊆ PSPACE",         part: "Lecture B: power and limits" },
    { file: "pp.html",           num: "9",  title: "Centerpiece: BQP ⊆ PP",         part: "Lecture B: power and limits", star: true },
    { file: "conclusion.html",   num: "10", title: "Conclusion and References",          part: "Wrapping up" },
    { file: "glossary.html",     num: "",   title: "Glossary and Notation",              part: "Reference" }
  ];

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
  // Layout: sidebar + table of contents + pager
  // ------------------------------------------------------------------
  function buildLayout() {
    var main = document.querySelector("main");
    if (!main) return;
    var layout = el("div", { class: "layout" });
    main.parentNode.insertBefore(layout, main);
    var side = el("nav", { id: "sidebar", "aria-label": "Site navigation" });
    layout.appendChild(side);
    layout.appendChild(main);

    var btn = el("button", { id: "menu-btn", "aria-label": "Open navigation" }, "☰ Contents");
    btn.addEventListener("click", function () { document.body.classList.toggle("nav-open"); });
    document.body.appendChild(btn);
    main.addEventListener("click", function () { document.body.classList.remove("nav-open"); });

    var h = '<a class="site-title" href="index.html">Quantum Computation</a>' +
            '<div class="site-sub">A complexity theory view &middot; for 15-455 students</div>';
    var lastPart = null, list = "";
    PAGES.forEach(function (p, i) {
      if (p.part !== lastPart) {
        if (lastPart !== null) list += "</ol>";
        list += '<div class="part">' + p.part + "</div><ol>";
        lastPart = p.part;
      }
      var cls = (i === curIdx ? "current" : "") + (p.star ? " star" : "");
      list += '<li class="' + cls.trim() + '"><a href="' + p.file + '"><span class="num">' + (p.num || "&middot;") +
              "</span><span>" + p.title + "</span></a>" + (i === curIdx ? '<div class="toc" id="toc"></div>' : "") + "</li>";
    });
    list += "</ol>";
    h += list;
    h += '<div class="side-tools"><a href="glossary.html">&#128214; All definitions (glossary)</a>' +
         '<a href="glossary.html#notation">&#8721; Notation table</a>' +
         '<a href="pp.html#thm-main">&#9733; Jump to the centerpiece theorem</a></div>';
    side.innerHTML = h;

    // table of contents from the h2's of this page
    var toc = document.getElementById("toc");
    var heads = main.querySelectorAll("h2");
    if (toc) {
      heads.forEach(function (hd) {
        if (!hd.id) hd.id = slug(hd.textContent);
        var a = el("a", { href: "#" + hd.id }, hd.innerHTML.replace(/<span class="sec">.*?<\/span>/, ""));
        toc.appendChild(a);
      });
      if (!heads.length) toc.remove();
      // scroll-spy
      var links = toc.querySelectorAll("a");
      var spy = function () {
        var y = window.scrollY + 90, active = null;
        heads.forEach(function (hd, i) { if (hd.offsetTop <= y) active = i; });
        links.forEach(function (a, i) { a.classList.toggle("active", i === active); });
      };
      window.addEventListener("scroll", spy, { passive: true });
      spy();
    }

    // pager
    var content = main.querySelector(".content") || main;
    var pager = el("nav", { class: "pager", "aria-label": "Previous and next page" });
    if (curIdx > 0) {
      var pv = PAGES[curIdx - 1];
      pager.appendChild(el("a", { class: "prev", href: pv.file }, '<span class="dir">&larr; Previous</span>' + (pv.num ? pv.num + ". " : "") + pv.title));
    }
    if (curIdx >= 0 && curIdx < PAGES.length - 1) {
      var nx = PAGES[curIdx + 1];
      pager.appendChild(el("a", { class: "next", href: nx.file }, '<span class="dir">Next &rarr;</span>' + (nx.num ? nx.num + ". " : "") + nx.title));
    }
    content.appendChild(pager);
    content.appendChild(el("footer", { class: "site-foot" },
      "Quantum Computation: A Complexity Theory View &middot; a 15-455 (CMU Undergraduate Complexity Theory) project. " +
      'Sources for every result are listed on the <a href="conclusion.html#references">references</a> page.'));

    // make each box label a self-link
    main.querySelectorAll(".box[id] > .box-title .label").forEach(function (lab) {
      var box = lab.closest(".box");
      var a = el("a", { href: "#" + box.id, title: "Link to this item", style: "color:inherit;text-decoration:none" });
      lab.parentNode.insertBefore(a, lab);
      a.appendChild(lab);
    });
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
          pv.appendChild(el("div", { class: "pv-src" }, "From " + (pg ? (pg.num ? "Page " + pg.num + ": " : "") + pg.title : fromFile) + " (click the link to go there)"));
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
      if (!a || a.closest("#sidebar") || a.closest(".pager") || a.closest(".box-title")) return;
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
