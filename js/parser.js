/* ============================================================
   R3A — Methods Text Parser
   Extracts numbered steps with parameters from Methods text
   ============================================================ */

const Parser = (() => {

  // Action verbs commonly found in scientific methods
  const ACTION_VERBS = [
    'prepared', 'collected', 'obtained', 'acquired', 'purchased', 'sourced',
    'dissolved', 'diluted', 'mixed', 'combined', 'added', 'pipetted',
    'incubated', 'heated', 'cooled', 'maintained', 'stored',
    'centrifuged', 'filtered', 'washed', 'rinsed', 'dried',
    'measured', 'weighed', 'quantified', 'calculated', 'determined',
    'analyzed', 'examined', 'assessed', 'evaluated', 'compared',
    'performed', 'conducted', 'carried out', 'executed', 'ran',
    'stained', 'labeled', 'tagged', 'marked',
    'extracted', 'isolated', 'purified', 'separated', 'eluted',
    'amplified', 'sequenced', 'cloned', 'transfected', 'transformed',
    'cultured', 'plated', 'seeded', 'passaged', 'harvested',
    'imaged', 'photographed', 'visualized', 'observed', 'recorded',
    'injected', 'administered', 'treated', 'exposed',
    'fitted', 'modeled', 'simulated', 'computed', 'processed',
    'normalized', 'standardized', 'calibrated', 'validated',
    'downloaded', 'uploaded', 'imported', 'exported',
    'trained', 'tested', 'deployed', 'configured', 'installed',
    'surveyed', 'interviewed', 'recruited', 'enrolled', 'randomized',
    'blinded', 'stratified', 'matched', 'assigned',
    'resuspended', 'homogenized', 'sonicated', 'vortexed', 'lyophilized',
    'fixed', 'embedded', 'sectioned', 'mounted',
    'blocked', 'probed', 'hybridized', 'blotted',
    'digested', 'ligated', 'denatured', 'annealed',
    'loaded', 'applied', 'coated', 'immobilized',
    'selected', 'identified', 'classified', 'clustered', 'grouped',
    'estimated', 'predicted', 'inferred', 'derived',
    'plotted', 'graphed', 'tabulated', 'summarized', 'reported',
    'adjusted', 'corrected', 'transformed', 'converted',
    'pooled', 'aliquoted', 'distributed', 'dispensed',
    'removed', 'discarded', 'eliminated', 'excluded',
    'verified', 'confirmed', 'replicated', 'repeated',
    'designed', 'developed', 'constructed', 'assembled', 'fabricated',
    'generated', 'synthesized', 'polymerized', 'crosslinked'
  ];

  // Parameter patterns (value + unit)
  const PARAM_PATTERNS = [
    // Temperature
    /\b\d+(?:\.\d+)?\s*°[CF]\b/gi,
    /\b\d+(?:\.\d+)?\s*degrees?\s*(?:Celsius|Fahrenheit|centigrade)\b/gi,
    // Time
    /\b\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?|seconds?|secs?|days?|weeks?|months?|ms|milliseconds?)\b/gi,
    // Concentration
    /\b\d+(?:\.\d+)?\s*(?:m[Mm]|µ[Mm]|n[Mm]|p[Mm]|[Mm]|mg\/[mL]L|µg\/[mL]L|ng\/[mL]L|%\s*(?:v\/v|w\/v|w\/w)?|mol\/[Ll]|mmol\/[Ll])\b/gi,
    /\b\d+(?:\.\d+)?\s*%/g,
    // Volume
    /\b\d+(?:\.\d+)?\s*(?:[mµn]?[Ll]|µl|ml|mL|µL|nL)\b/g,
    // Mass
    /\b\d+(?:\.\d+)?\s*(?:mg|µg|ng|pg|kg|g)\b/gi,
    // Speed (centrifuge)
    /\b\d+(?:,\d{3})*\s*(?:rpm|×?\s*g|rcf|RCF|xg)\b/gi,
    // Voltage, current
    /\b\d+(?:\.\d+)?\s*(?:kV|mV|V|mA|µA|A)\b/g,
    // Wavelength
    /\b\d+(?:\.\d+)?\s*nm\b/gi,
    // Pressure
    /\b\d+(?:\.\d+)?\s*(?:atm|Pa|kPa|MPa|bar|psi|mmHg|torr)\b/gi,
    // pH
    /pH\s*\d+(?:\.\d+)?/gi,
    // Cycles
    /\b\d+\s*(?:cycles?|iterations?|epochs?|passes?|rounds?)\b/gi,
    // Magnification
    /\b\d+[×xX]\b/g,
    // Frequency
    /\b\d+(?:\.\d+)?\s*(?:Hz|kHz|MHz|GHz)\b/gi,
    // Software versions
    /v\d+(?:\.\d+)+/gi,
    /version\s*\d+(?:\.\d+)*/gi,
    // Dimensions / counts
    /\b\d+(?:\.\d+)?\s*(?:mm|cm|µm|nm|m|km|inches?|in|ft|pixels?|px|bp|kb|Mb|Gb)\b/gi,
    // p-values
    /p\s*[<>=≤≥]\s*\d+(?:\.\d+)?/gi,
    // α / alpha levels
    /α\s*=\s*\d+(?:\.\d+)?/gi,
    /alpha\s*=\s*\d+(?:\.\d+)?/gi,
    // n = (sample size)
    /\bn\s*=\s*\d+/gi,
    // Ratios
    /\b\d+:\d+(?::\d+)?\b/g,
    // General number + unit catch (conservative)
    /\b\d+(?:\.\d+)?\s*(?:fold|×)\b/gi
  ];

  /**
   * Split Methods text into individual sentences, handling common abbreviations
   */
  function splitIntoSentences(text) {
    // Protect common abbreviations from sentence splitting
    const protections = [
      [/\b(e\.g)\./gi, '$1__DOT__'],
      [/\b(i\.e)\./gi, '$1__DOT__'],
      [/\b(et al)\./gi, '$1__DOT__'],
      [/\b(vs)\./gi, '$1__DOT__'],
      [/\b(Fig)\./gi, '$1__DOT__'],
      [/\b(Figs)\./gi, '$1__DOT__'],
      [/\b(Dr)\./gi, '$1__DOT__'],
      [/\b(Prof)\./gi, '$1__DOT__'],
      [/\b(Inc)\./gi, '$1__DOT__'],
      [/\b(Ltd)\./gi, '$1__DOT__'],
      [/\b(Corp)\./gi, '$1__DOT__'],
      [/\b(approx)\./gi, '$1__DOT__'],
      [/\b(No)\./gi, '$1__DOT__'],
      [/\b(Vol)\./gi, '$1__DOT__'],
      [/\b(ca)\./gi, '$1__DOT__'],
      [/(\d)\./g, '$1__NUMDOT__']
    ];

    let processed = text;
    for (const [pattern, replacement] of protections) {
      processed = processed.replace(pattern, replacement);
    }

    // Split on sentence boundaries
    const raw = processed.split(/(?<=[.!?])\s+(?=[A-Z])/);

    return raw
      .map(s => s
        .replace(/__DOT__/g, '.')
        .replace(/__NUMDOT__/g, '.')
        .trim()
      )
      .filter(s => s.length > 10); // filter out very short fragments
  }

  /**
   * Determine if a sentence describes an action/step
   */
  function isActionSentence(sentence) {
    const lower = sentence.toLowerCase();
    return ACTION_VERBS.some(verb => {
      const regex = new RegExp(`\\b${verb}\\b`, 'i');
      return regex.test(lower);
    });
  }

  /**
   * Extract parameter values from a sentence
   */
  function extractParams(sentence) {
    const params = new Set();
    for (const pattern of PARAM_PATTERNS) {
      const regex = new RegExp(pattern.source, pattern.flags);
      let match;
      while ((match = regex.exec(sentence)) !== null) {
        params.add(match[0].trim());
      }
    }
    return [...params];
  }

  /**
   * Clean and trim a sentence for display as a step action
   */
  function cleanAction(sentence) {
    return sentence
      .replace(/^\s*[-–—•*]\s*/, '') // remove leading bullets
      .replace(/\s+/g, ' ')           // normalize whitespace
      .trim();
  }

  /**
   * Main parse function: Methods text → array of step objects
   */
  function parse(methodsText) {
    if (!methodsText || typeof methodsText !== 'string') {
      return [];
    }

    const sentences = splitIntoSentences(methodsText);
    const steps = [];
    let stepNum = 1;

    for (const sentence of sentences) {
      // Keep sentences that are action-oriented or contain parameters
      const params = extractParams(sentence);
      const isAction = isActionSentence(sentence);

      if (isAction || params.length > 0) {
        steps.push({
          step: stepNum++,
          action: cleanAction(sentence),
          params: params
        });
      }
    }

    // If no steps detected with heuristics, fall back to treating each sentence as a step
    if (steps.length === 0 && sentences.length > 0) {
      for (const sentence of sentences) {
        steps.push({
          step: stepNum++,
          action: cleanAction(sentence),
          params: extractParams(sentence)
        });
      }
    }

    return steps;
  }

  // Public API
  return { parse, extractParams, splitIntoSentences };

})();
