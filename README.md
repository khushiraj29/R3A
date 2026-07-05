# R3A — Rapid Research Reproducibility Assistant

> **Capstone Project 2026**  
> A client-side web application that analyzes Methods sections from research papers and produces structured reproducibility assessments.

---

## 🎯 Problem Statement

Scientific reproducibility is in crisis. Studies show that over 70% of researchers have failed to reproduce another scientist's experiments. A major contributor is **incomplete Methods reporting** — missing reagent details, unlisted software versions, absent statistical parameters, and inaccessible data.

**R3A** addresses this by providing an automated tool that instantly evaluates a Methods section against reproducibility best practices and generates actionable feedback for authors.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Step Extraction** | Breaks Methods text into numbered, actionable steps with highlighted parameters |
| **Reproducibility Checklist** | Evaluates 6 categories: Materials, Equipment, Software, Data, Parameters, Statistical Tests |
| **Missing Info Prompts** | Generates priority-ranked author prompts for absent items (High / Medium / Low) |
| **Score Ring** | Visual reproducibility score (0–100%) with animated ring chart |
| **JSON Export** | Download or copy results as structured JSON |
| **Built-in Demo** | Pre-loaded sample Methods text for immediate demonstration |
| **Responsive Design** | Works on desktop, tablet, and mobile |
| **Print-Friendly** | Clean print styles for capstone submission |

---

## 🚀 Getting Started

### Prerequisites

None! R3A is a **pure client-side application** — no server, no build step, no API keys.

### Run Locally

1. Clone or download this repository
2. Open `index.html` in any modern browser

```bash
# Or use a simple HTTP server for best results:
npx serve .
# Then open http://localhost:3000
```

### Deploy

R3A can be deployed to any static hosting service:
- **GitHub Pages** — Push to a `gh-pages` branch
- **Netlify** — Drop the folder into Netlify
- **Vercel** — Import the repository

---

## 🏗️ Architecture

```
R3A/
├── index.html              # Entry point (semantic HTML5, ARIA accessible)
├── css/
│   └── styles.css          # Design system: tokens, components, animations
├── js/
│   ├── parser.js           # Methods text → steps (action verbs + param regex)
│   ├── checklist.js         # 6-category reproducibility evaluation
│   ├── missing.js           # Priority-ranked prompt generation
│   └── app.js              # UI controller, rendering, export
├── assets/
│   └── favicon.svg          # App icon
└── README.md               # This file
```

### Analysis Pipeline

```
Methods Text
     │
     ▼
┌─────────┐     ┌────────────┐     ┌────────────┐
│ Parser   │────▶│ Checklist  │────▶│ Missing    │
│ (steps)  │     │ (evaluate) │     │ (prompts)  │
└─────────┘     └────────────┘     └────────────┘
     │                │                   │
     ▼                ▼                   ▼
   Steps[]      Categories{}        Prompts[]
     │                │                   │
     └────────────────┼───────────────────┘
                      ▼
              JSON Output + UI
```

### How It Works

1. **Parser** (`parser.js`):  
   - Splits text into sentences (handling abbreviations like "e.g.", "et al.")
   - Identifies action sentences via a dictionary of ~150 scientific action verbs
   - Extracts parameters using 25+ regex patterns (temperature, concentration, time, pH, etc.)

2. **Checklist** (`checklist.js`):  
   - Searches for keywords across 6 categories using curated dictionaries
   - Each category has subcategories (e.g., Materials → reagents, identifiers, suppliers)
   - Marks categories as Present (≥2 matches) or Absent

3. **Missing Info** (`missing.js`):  
   - For each Absent category, generates specific author-facing prompts
   - Prompts are prioritized: High (Materials, Parameters, Stats), Medium (Equipment, Software), context-dependent (Data)
   - Includes reasoning for why each detail is critical

---

## 📊 Output Format

R3A produces a JSON object with three keys:

```json
{
  "steps": [
    { "step": 1, "action": "Cells were cultured in DMEM...", "params": ["37°C", "5% CO2"] }
  ],
  "checklist": {
    "Materials": { "status": "Present", "explanation": "..." },
    "Equipment": { "status": "Absent", "explanation": "..." }
  },
  "missing_info_prompts": [
    { "priority": "High", "prompt": "Please specify the equipment..." }
  ]
}
```

---

## 🎨 Design

- **Theme**: Dark mode with deep navy gradients
- **Effects**: Glassmorphism cards, floating ambient orbs, shimmer animations
- **Typography**: Inter (body) + JetBrains Mono (parameters/code)
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigable

---

## 📚 References

- Baker, M. (2016). "1,500 scientists lift the lid on reproducibility." *Nature*, 533, 452–454.
- Nosek, B. A., et al. (2015). "Promoting an open research culture." *Science*, 348, 1422–1425.
- NIH Rigor and Reproducibility Guidelines
- ARRIVE Guidelines for Reporting Animal Research
- CONSORT Statement for Randomized Trials

---

## 📄 License

This project is developed as an academic capstone. All rights reserved.

---

<p align="center">
  <strong>R3A</strong> — Making research methods transparent, one paper at a time. 🔬
</p>
