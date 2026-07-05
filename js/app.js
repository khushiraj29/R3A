/* ============================================================
   R3A — Main Application Controller
   Orchestrates UI, parsing pipeline, rendering, and export
   ============================================================ */

const App = (() => {

  // ---------- State ----------
  let currentResults = null;

  // ---------- Sample Methods Text ----------
  const SAMPLE_METHODS = `Cell Culture and Treatment. Human HeLa cells (ATCC, CCL-2) were cultured in Dulbecco's Modified Eagle Medium (DMEM, Gibco, cat# 11965092) supplemented with 10% fetal bovine serum (FBS, Sigma-Aldrich, cat# F7524) and 1% penicillin-streptomycin (Gibco, cat# 15140122) at 37°C in a humidified atmosphere containing 5% CO2. Cells were passaged every 3 days using 0.25% trypsin-EDTA (Gibco) and seeded at a density of 2 × 10⁵ cells per well in 6-well plates 24 hours before treatment.

Drug Treatment. Cells were treated with doxorubicin (Sigma-Aldrich, cat# D1515) at concentrations of 0.1, 0.5, 1.0, 5.0, and 10.0 µM for 48 hours. Control cells received an equivalent volume of DMSO (final concentration 0.1% v/v). Each condition was performed in triplicate across three independent biological replicates (n = 9 per condition).

Flow Cytometry. Following treatment, cells were harvested, washed twice with cold PBS, and stained with Annexin V-FITC (BD Biosciences, cat# 556419) and propidium iodide (PI) according to the manufacturer's protocol. Samples were analyzed on a BD FACSCanto II flow cytometer (BD Biosciences) equipped with 488 nm and 633 nm lasers. A minimum of 10,000 events were recorded per sample. Data were analyzed using FlowJo v10.8.1 (BD Life Sciences). Gating strategy was based on unstained and single-stained controls.

Western Blotting. Total protein was extracted using RIPA buffer (Thermo Fisher, cat# 89901) supplemented with protease and phosphatase inhibitor cocktails (Roche). Protein concentration was determined by BCA assay (Pierce, cat# 23225). Equal amounts of protein (30 µg per lane) were separated by 10% SDS-PAGE at 120 V for 90 minutes, then transferred to PVDF membranes (Millipore, cat# IPVH00010) at 100 V for 60 minutes. Membranes were blocked with 5% non-fat dry milk in TBST for 1 hour at room temperature and probed overnight at 4°C with primary antibodies against cleaved caspase-3 (1:1000, Cell Signaling Technology, cat# 9664), PARP (1:1000, Cell Signaling Technology, cat# 9542), and β-actin (1:5000, Sigma-Aldrich, cat# A5316). After washing, membranes were incubated with HRP-conjugated secondary antibodies (1:10000, Jackson ImmunoResearch) for 1 hour at room temperature. Bands were visualized using enhanced chemiluminescence (ECL, Bio-Rad, cat# 1705061) and imaged on a ChemiDoc MP system (Bio-Rad).

Statistical Analysis. All data are presented as mean ± standard deviation (SD). Statistical comparisons between two groups were performed using a two-tailed unpaired Student's t-test. Comparisons among multiple groups were analyzed by one-way ANOVA followed by Tukey's post-hoc test. A p-value of less than 0.05 was considered statistically significant (α = 0.05). All statistical analyses were performed using GraphPad Prism v9.5.1 (GraphPad Software, San Diego, CA, USA). Dose-response curves were fitted using a four-parameter logistic regression model. IC50 values were interpolated from the fitted curves. Effect sizes were calculated using Cohen's d.`;

  // ---------- DOM References ----------
  const DOM = {};

  function cacheDom() {
    DOM.methodsInput = document.getElementById('methods-input');
    DOM.charCount = document.getElementById('char-count');
    DOM.analyzeBtn = document.getElementById('analyze-btn');
    DOM.sampleBtn = document.getElementById('sample-btn');
    DOM.clearBtn = document.getElementById('clear-btn');
    DOM.resultsSection = document.getElementById('results-section');
    DOM.exportBar = document.getElementById('export-bar');
    DOM.tabBtns = document.querySelectorAll('.tab-btn');
    DOM.tabPanels = document.querySelectorAll('.tab-panel');

    // Result containers
    DOM.stepsList = document.getElementById('steps-list');
    DOM.checklistGrid = document.getElementById('checklist-grid');
    DOM.promptsList = document.getElementById('prompts-list');

    // Stats
    DOM.statSteps = document.getElementById('stat-steps');
    DOM.statPresent = document.getElementById('stat-present');
    DOM.statAbsent = document.getElementById('stat-absent');
    DOM.statScore = document.getElementById('stat-score');

    // Score ring
    DOM.scoreRingFill = document.getElementById('score-ring-fill');
    DOM.scoreRingValue = document.getElementById('score-ring-value');

    // Tab counts
    DOM.tabCountSteps = document.getElementById('tab-count-steps');
    DOM.tabCountChecklist = document.getElementById('tab-count-checklist');
    DOM.tabCountMissing = document.getElementById('tab-count-missing');

    // Export buttons
    DOM.downloadJsonBtn = document.getElementById('download-json-btn');
    DOM.copyJsonBtn = document.getElementById('copy-json-btn');

    // Toast
    DOM.toast = document.getElementById('toast');
  }

  // ---------- Event Listeners ----------

  function bindEvents() {
    DOM.methodsInput.addEventListener('input', handleInputChange);
    DOM.analyzeBtn.addEventListener('click', handleAnalyze);
    DOM.sampleBtn.addEventListener('click', handleLoadSample);
    DOM.clearBtn.addEventListener('click', handleClear);
    DOM.downloadJsonBtn.addEventListener('click', handleDownloadJson);
    DOM.copyJsonBtn.addEventListener('click', handleCopyJson);

    DOM.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  // ---------- Event Handlers ----------

  function handleInputChange() {
    const len = DOM.methodsInput.value.length;
    DOM.charCount.textContent = `${len.toLocaleString()} characters`;
    DOM.analyzeBtn.disabled = len < 20;
  }

  function handleLoadSample() {
    DOM.methodsInput.value = SAMPLE_METHODS;
    handleInputChange();
    DOM.methodsInput.focus();

    // Subtle animation
    DOM.methodsInput.style.borderColor = 'var(--accent-secondary)';
    DOM.methodsInput.style.boxShadow = 'var(--shadow-glow-amber)';
    setTimeout(() => {
      DOM.methodsInput.style.borderColor = '';
      DOM.methodsInput.style.boxShadow = '';
    }, 800);
  }

  function handleClear() {
    DOM.methodsInput.value = '';
    handleInputChange();
    DOM.resultsSection.classList.remove('active');
    DOM.exportBar.classList.remove('active');
    currentResults = null;
    DOM.methodsInput.focus();
  }

  function handleAnalyze() {
    const text = DOM.methodsInput.value.trim();
    if (text.length < 20) return;

    // Loading state
    DOM.analyzeBtn.classList.add('btn--loading');
    DOM.analyzeBtn.querySelector('.btn__text').textContent = 'Analyzing...';

    // Simulate brief processing delay for UX
    setTimeout(() => {
      try {
        // Run pipeline
        const steps = Parser.parse(text);
        const checklistResults = Checklist.analyze(text);
        const missingPrompts = MissingInfo.generate(checklistResults);

        currentResults = {
          steps,
          checklist: checklistResults,
          missing_info_prompts: missingPrompts
        };

        // Render results
        renderSteps(steps);
        renderChecklist(checklistResults);
        renderMissingPrompts(missingPrompts);
        renderStats(steps, checklistResults, missingPrompts);
        updateScoreRing(checklistResults.summary.score);
        updateTabCounts(steps.length, checklistResults.summary.totalCategories, missingPrompts.length);

        // Show results
        DOM.resultsSection.classList.add('active');
        DOM.exportBar.classList.add('active');

        // Scroll to results
        setTimeout(() => {
          DOM.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);

      } catch (err) {
        console.error('Analysis error:', err);
        showToast('Analysis failed. Please check input text.');
      }

      // Reset button
      DOM.analyzeBtn.classList.remove('btn--loading');
      DOM.analyzeBtn.querySelector('.btn__text').textContent = 'Analyze Methods';
    }, 600);
  }

  function handleDownloadJson() {
    if (!currentResults) return;

    // Build clean export object matching the specified schema
    const exportObj = {
      steps: currentResults.steps,
      checklist: {},
      missing_info_prompts: currentResults.missing_info_prompts.map(p => ({
        priority: p.priority,
        prompt: p.prompt
      }))
    };

    // Format checklist
    for (const [key, cat] of Object.entries(currentResults.checklist.categories)) {
      exportObj.checklist[cat.label] = {
        status: cat.status,
        explanation: cat.importance
      };
    }

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'r3a-analysis.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON downloaded successfully!');
  }

  function handleCopyJson() {
    if (!currentResults) return;

    const exportObj = {
      steps: currentResults.steps,
      checklist: {},
      missing_info_prompts: currentResults.missing_info_prompts.map(p => ({
        priority: p.priority,
        prompt: p.prompt
      }))
    };

    for (const [key, cat] of Object.entries(currentResults.checklist.categories)) {
      exportObj.checklist[cat.label] = {
        status: cat.status,
        explanation: cat.importance
      };
    }

    navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2))
      .then(() => showToast('JSON copied to clipboard!'))
      .catch(() => showToast('Copy failed. Try downloading instead.'));
  }

  // ---------- Tab Switching ----------

  function switchTab(tabId) {
    DOM.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    DOM.tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });
  }

  // ---------- Rendering ----------

  function renderSteps(steps) {
    if (steps.length === 0) {
      DOM.stepsList.innerHTML = `
        <div style="text-align:center; padding: 2rem; color: var(--text-muted);">
          <p>No distinct steps could be extracted. The Methods text may be too short or unstructured.</p>
        </div>`;
      return;
    }

    DOM.stepsList.innerHTML = steps.map(s => `
      <li class="step-item">
        <span class="step-number">${s.step}</span>
        <div class="step-content">
          <p class="step-action">${highlightParams(s.action, s.params)}</p>
          ${s.params.length > 0 ? `
            <div class="step-params">
              ${s.params.map(p => `<span class="param-badge">${escapeHtml(p)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </li>
    `).join('');
  }

  function renderChecklist(checklistResults) {
    const categories = Object.values(checklistResults.categories);

    DOM.checklistGrid.innerHTML = categories.map(cat => `
      <div class="checklist-card checklist-card--${cat.status.toLowerCase()}">
        <div class="checklist-card__header">
          <div class="checklist-card__title">
            ${getCategoryIcon(cat.icon)}
            ${escapeHtml(cat.label)}
          </div>
          <span class="status-badge status-badge--${cat.status.toLowerCase()}">
            ${cat.status === 'Present' ? '✓ Present' : '✗ Absent'}
          </span>
        </div>
        <p class="checklist-card__explanation">${escapeHtml(cat.importance)}</p>
        ${cat.details && cat.details.length > 0 ? `
          <div class="checklist-card__details">
            ${cat.details.map(d => `
              <div class="checklist-card__detail-item">
                Found: ${d.matches.slice(0, 5).map(m => escapeHtml(String(m))).join(', ')}${d.matches.length > 5 ? ` +${d.matches.length - 5} more` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  function renderMissingPrompts(prompts) {
    if (prompts.length === 0) {
      DOM.promptsList.innerHTML = `
        <div style="text-align:center; padding: 2rem;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🎉</div>
          <p style="color: var(--accent-success); font-size: var(--fs-lg); font-weight: var(--fw-semibold);">
            Excellent! No critical information gaps detected.
          </p>
          <p style="color: var(--text-secondary); margin-top: 0.5rem;">
            The Methods section appears to be well-documented across all categories.
          </p>
        </div>`;
      return;
    }

    DOM.promptsList.innerHTML = prompts.map(p => `
      <div class="prompt-card prompt-card--${p.priority.toLowerCase()}">
        <div class="prompt-card__header">
          <span class="priority-badge priority-badge--${p.priority.toLowerCase()}">${p.priority}</span>
          <span class="prompt-card__category">${escapeHtml(p.category)}</span>
        </div>
        <p class="prompt-card__text">${escapeHtml(p.prompt)}</p>
        <p class="prompt-card__reasoning">${escapeHtml(p.reasoning)}</p>
      </div>
    `).join('');
  }

  function renderStats(steps, checklistResults, missingPrompts) {
    const summary = checklistResults.summary;
    DOM.statSteps.textContent = steps.length;
    DOM.statPresent.textContent = summary.presentCount;
    DOM.statAbsent.textContent = summary.absentCount;
    DOM.statScore.textContent = `${summary.score}%`;
  }

  function updateScoreRing(score) {
    const circumference = 2 * Math.PI * 58; // r = 58
    const offset = circumference - (score / 100) * circumference;
    DOM.scoreRingFill.style.strokeDasharray = `${circumference}`;
    DOM.scoreRingFill.style.strokeDashoffset = `${circumference}`; // start full

    // Animate
    requestAnimationFrame(() => {
      setTimeout(() => {
        DOM.scoreRingFill.style.strokeDashoffset = `${offset}`;
      }, 100);
    });

    DOM.scoreRingValue.textContent = `${score}%`;

    // Color based on score
    if (score >= 80) {
      DOM.scoreRingFill.style.stroke = 'var(--accent-success)';
      DOM.scoreRingValue.style.color = 'var(--accent-success)';
    } else if (score >= 50) {
      DOM.scoreRingFill.style.stroke = 'var(--accent-warning)';
      DOM.scoreRingValue.style.color = 'var(--accent-warning)';
    } else {
      DOM.scoreRingFill.style.stroke = 'var(--accent-danger)';
      DOM.scoreRingValue.style.color = 'var(--accent-danger)';
    }
  }

  function updateTabCounts(stepsCount, checklistCount, missingCount) {
    DOM.tabCountSteps.textContent = stepsCount;
    DOM.tabCountChecklist.textContent = checklistCount;
    DOM.tabCountMissing.textContent = missingCount;
  }

  // ---------- Utilities ----------

  function highlightParams(text, params) {
    let result = escapeHtml(text);
    for (const param of params) {
      const escaped = escapeHtml(param);
      // Highlight the parameter in the text with a span
      const regex = new RegExp(escapeRegex(escaped), 'g');
      result = result.replace(regex, `<mark style="background:rgba(0,212,255,0.15);color:var(--accent-primary);padding:1px 4px;border-radius:3px;font-family:var(--font-mono);font-size:0.9em;">${escaped}</mark>`);
    }
    return result;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function getCategoryIcon(iconName) {
    const icons = {
      beaker: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 3h15"/><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3"/><path d="M6 14h12"/></svg>`,
      cpu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
      code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
      database: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>`,
      sliders: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>`,
      chart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>`
    };
    return icons[iconName] || '';
  }

  function showToast(message) {
    DOM.toast.textContent = message;
    DOM.toast.classList.add('show');
    setTimeout(() => DOM.toast.classList.remove('show'), 2500);
  }

  // ---------- Init ----------

  function init() {
    cacheDom();
    bindEvents();
    handleInputChange();
  }

  // Boot
  document.addEventListener('DOMContentLoaded', init);

  // Public API (for debugging)
  return { getResults: () => currentResults };

})();
