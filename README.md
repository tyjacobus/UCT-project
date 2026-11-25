# Quantum Computation: A Complexity Theory View

A CS455 (CMU Undergraduate Complexity Theory) project: scribe-style notes on quantum computation
whose main theorem is **BQP ⊆ PP** (Adleman–DeMarrais–Huang 1997), with a complete proof.
The layout, statement blocks, collapsible proofs and notation follow the CS455 Panda Notes scribe notes.

## Structure

| File | Page |
|---|---|
| `index.html` | Overview, roadmap, prerequisites, notation |
| `intro.html` | 1. Why quantum complexity? |
| `background.html` | 2. Background review (linear algebra, tensor products, PP, uniform circuits) |
| `states.html` | 3. Qubits and quantum states |
| `gates.html` | 4. Unitary gates and circuits |
| `interference.html` | 5. Quantum vs. randomized computation |
| `bqp.html` | 6. BQP and reversible computation (P ⊆ BPP ⊆ BQP) |
| `pp.html` | 7. Path-sum lemma and the Main Theorem: BQP ⊆ PP |
| `conclusion.html` | 8. Conclusion, omitted details, references |
| `glossary.html` | Index of definitions and notation |

Shared code lives in `assets/`:

- `site.js` builds the sidebar, per-page table of contents, prev/next links, renders math (KaTeX, vendored in `assets/katex`),
  draws circuit diagrams from `<figure class="circuit" data-wires=... data-gates=...>`, and shows hover previews for links to any
  definition/theorem box (`<div class="box ..." id="...">`), including boxes on other pages.
  **To add or rename a chapter, edit the `PAGES` array at the top of `site.js`; an optional byline for the chapter banners is `SCRIBE` there (currently empty).**
- `explorer.js` is the interactive path-sum explorer embedded on Pages 8 and 9.
- `site.css` holds all styles (light and dark mode).

Math is written inline as `$...$` and `$$...$$`. Macros such as `\ket{x}`, `\braket{z}{\psi}`, `\amp{y}{C}{x}` are defined in `site.js`.

Hover previews fetch other pages, so they work on GitHub Pages or any local web server
(`python3 -m http.server`), but not when opening the files directly with `file://`.

Statement blocks are `<div class="box def|thm|lem|prop|fact|cor|ex|rem">` with a `.box-title` (label + name); proofs are `<div class="proof">` and are made collapsible by `site.js`.
Pseudocode uses `<div class="pseudo">` with one `<div>` per line (`class="i1"`, `i2`, ... for indentation).
