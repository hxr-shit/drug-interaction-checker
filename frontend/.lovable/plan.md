## Drug Interaction & Organ Safety Checker

A premium dark-blue biomedical web app: a landing page with an animated hero and drug search, an AI-pipeline loading sequence, and a full results dashboard whose centerpiece is an interactive 3D anatomical model mapped to all 27 MedDRA System Organ Classes.

### Design system

- **Palette (dark mode primary, light mode fully supported):** navy / midnight / deep indigo-blue surfaces, slate text, white, cyan accents. Semantic status colors: green (safe), amber (moderate), red (major/contraindicated). No purple, violet, pink, magenta, or yellow gradients anywhere.
- **Typography:** Space Grotesk for large headings, Plus Jakarta Sans for body. Apple-scale hero type, generous line height.
- **Surfaces:** 20–24px radii, glassmorphism panels with soft layered shadows, subtle cyan glow on active elements.
- **Motion:** hover lift, scroll reveal, animated counters, elastic buttons, smooth card/page transitions, parallax hero background.

### Landing page

- **Navbar:** logo left; Home, Drug Checker, Documentation, About, API; theme toggle + GitHub on the right. Collapses to a sheet menu on mobile.
- **Hero:** "Understand Drug Interactions Before They Become Problems." with the described subheading, primary CTA **Enter the Drugs** and secondary **Learn More**. Background is a very subtle animated molecular/DNA particle mesh on deep navy — low contrast, no clutter.
- **Left feature rail:** Interaction Detection, Organ-specific Risk Analysis, Mechanism Explanation, Patient-friendly Reports.
- **Search card:** large floating glass card below the hero with Drug A / Drug B autocomplete inputs, animated swap button, recent searches, popular drug chips, and an animated analyze button.

### AI pipeline loader

Full-screen stepped sequence replacing any spinner: Searching databases → Checking interaction → Analyzing adverse effects → Mapping affected organs → Generating explanation. Each step animates in with a progress bar and check state, then transitions into the dashboard.

### Results dashboard

Collapsible left sidebar: Dashboard, Search, History, Saved Reports, Documentation, Settings. Filter bar for severity, SOC, mechanism, and confidence.

1. **Overall Risk** — animated radial severity gauge (Safe / Minor / Moderate / Major / Contraindicated).
2. **Mechanism** — animated vertical timeline: Drug A → Enzyme → Protein → Interaction → Outcome.
3. **Organ Impact** — rotatable 3D human body (React Three Fiber) built from primitive/lathe geometry organs. Hover highlights, affected organs emit a colored glow by severity, healthy organs stay neutral slate. Clicking an organ opens a detail panel with the SOC, explanation, severity, symptoms, and confidence. All 27 MedDRA SOCs are represented — SOCs without a physical location (e.g. Social circumstances, Investigations) appear as satellite markers around the model.
4. **Organ Cards** — one expandable card per affected SOC with severity, explanation, symptoms, evidence.
5. **Interaction Graph** — animated node/edge graph: Drug A → Protein → Gene → Organ → Clinical Effect.
6. **Side Effects Comparison** — two columns with shared effects highlighted and unique effects separated.
7. **Recommendations** — green / amber / red cards (Monitor INR, Avoid Alcohol, Consult Physician, Emergency Warning).
8. **Confidence** — animated score with source badges: DrugBank, DDInter, FAERS, OpenFDA, PubMed.

**Cross-highlighting:** a shared hover context links the 3D model, organ cards, side-effect rows, and graph pathways — hovering any one highlights its counterparts everywhere.

### Data layer

All results come from a typed data module (`src/lib/interactions/`) with Zod-validated shapes for interactions, SOCs, mechanism steps, graph nodes, recommendations, and confidence. It ships with rich sample data for several real drug pairs (e.g. warfarin + aspirin, simvastatin + clarithromycin) behind a single async `checkInteraction()` function wrapped in TanStack Query — so pointing it at your real API later is a one-file change with no UI edits.

### Technical notes

- TanStack Start with file-based routes: `/` (landing), `/checker` (dashboard), plus stub routes for Documentation, About, and API. Each route gets its own SEO head metadata.
- Tailwind v4 tokens defined in `src/styles.css`; fonts loaded via `<link>` in `__root.tsx`.
- Motion for React for animation; shadcn/ui primitives; Lucide icons.
- React Three Fiber + drei for the anatomy viewer, lazy-loaded client-side only with a graceful 2D fallback so SSR stays intact.
- Fully responsive: desktop-first, collapsible sidebar, adaptive card grid, touch-friendly anatomy controls.

### Not included

No authentication, database, or live medical data source in this pass — the app runs entirely on the typed mock layer until your API is ready.
