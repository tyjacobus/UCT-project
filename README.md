# Quantum Computation: A Complexity Theory View

A 15-455 (CMU Undergraduate Complexity Theory) project: an educational site on quantum computation
whose centerpiece is the theorem **BQP ⊆ PP** (Adleman–DeMarrais–Huang 1997), with a complete proof.

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
| `algorithms.html` | 7. Query algorithms (Deutsch–Jozsa, Bernstein–Vazirani) |
| `pspace.html` | 8. Path-sum lemma and BQP ⊆ PSPACE |
| `pp.html` | 9. Centerpiece: BQP ⊆ PP |
| `conclusion.html` | 10. Conclusion, omitted details, references |
| `glossary.html` | All definitions and notation |

Shared code lives in `assets/`:

- `site.js` builds the sidebar, per-page table of contents, prev/next links, renders math (KaTeX, vendored in `assets/katex`),
  draws circuit diagrams from `<figure class="circuit" data-wires=... data-gates=...>`, and shows hover previews for links to any
  definition/theorem box (`<div class="box ..." id="...">`), including boxes on other pages.
  **To add or rename a page, edit the `PAGES` array at the top of `site.js`.**
- `explorer.js` is the interactive path-sum explorer embedded on Pages 8 and 9.
- `site.css` holds all styles (light and dark mode).

Math is written inline as `$...$` and `$$...$$`. Macros such as `\ket{x}`, `\braket{z}{\psi}`, `\amp{y}{C}{x}` are defined in `site.js`.

Hover previews fetch other pages, so they work on GitHub Pages or any local web server
(`python3 -m http.server`), but not when opening the files directly with `file://`.
