/* ============================================================
   R3A — Missing Information Prompt Generator
   Generates prioritized author prompts for absent checklist items
   ============================================================ */

const MissingInfo = (() => {

  // Priority rules:  category → base priority
  const PRIORITY_MAP = {
    materials:        'High',
    parameters:       'High',
    statisticalTests: 'High',
    equipment:        'Medium',
    software:         'Medium',
    data:             'High'
  };

  // Detailed prompt templates per category
  const PROMPT_TEMPLATES = {

    materials: {
      prompts: [
        {
          condition: (details) => !hasSubCategory(details, 'reagents'),
          prompt: 'Please list all reagents, cell lines, organisms, or survey instruments used, including full names and any relevant identifiers (e.g., species, strain, passage number).',
          reasoning: 'Without a complete materials list, other researchers cannot source identical reagents, which is the most fundamental requirement for replication.'
        },
        {
          condition: (details) => !hasSubCategory(details, 'identifiers'),
          prompt: 'Please provide catalog numbers, lot numbers, RRID identifiers, or accession numbers for all key reagents and biological materials.',
          reasoning: 'Catalog/lot numbers uniquely identify the exact product used. Different formulations from the same supplier can produce different results.'
        },
        {
          condition: (details) => !hasSubCategory(details, 'suppliers'),
          prompt: 'Please specify the manufacturer or supplier for each reagent, antibody, kit, and biological material used.',
          reasoning: 'Supplier information is critical because equivalent reagents from different manufacturers may have different purities, concentrations, or formulations.'
        }
      ],
      fallback: {
        prompt: 'The methods section lacks sufficient detail about materials used. Please provide a comprehensive list of all reagents, cell lines, antibodies, kits, and other materials, including supplier names, catalog numbers, and concentrations where applicable.',
        reasoning: 'Complete material documentation is the cornerstone of experimental reproducibility. Without it, independent replication is effectively impossible.'
      }
    },

    equipment: {
      prompts: [
        {
          condition: (details) => !hasSubCategory(details, 'instruments'),
          prompt: 'Please specify the instruments and equipment used for each experimental procedure (e.g., centrifuge model, microscope type, sequencing platform).',
          reasoning: 'Different instrument models have different sensitivities, resolutions, and capabilities that directly affect measurement outcomes.'
        },
        {
          condition: (details) => !hasSubCategory(details, 'identifiers'),
          prompt: 'Please include model numbers, firmware versions, and any relevant hardware specifications for the key instruments used.',
          reasoning: 'Model-specific information helps replicators match exact instrument settings. Firmware differences can alter instrument behavior and data output.'
        },
        {
          condition: (details) => !hasSubCategory(details, 'manufacturers'),
          prompt: 'Please provide the manufacturer name for each piece of equipment mentioned.',
          reasoning: 'Manufacturer identification disambiguates equipment references and helps locate identical or equivalent instruments.'
        }
      ],
      fallback: {
        prompt: 'Equipment details are insufficiently documented. Please provide the instrument names, manufacturers, model numbers, and any relevant settings (e.g., detector type, objective lens, column specifications) for all key equipment.',
        reasoning: 'Equipment specifications ensure that measurements are taken under comparable conditions, which is important for quantitative reproducibility.'
      }
    },

    software: {
      prompts: [
        {
          condition: (details) => !hasSubCategory(details, 'names'),
          prompt: 'Please list all software tools, programming languages, and packages used for data processing, analysis, and visualization.',
          reasoning: 'Software identification is essential because different tools may implement the same algorithm differently, leading to divergent results.'
        },
        {
          condition: (details) => !hasSubCategory(details, 'versionIndicators'),
          prompt: 'Please specify the version numbers for all software tools and packages used (e.g., "R v4.3.1", "Python 3.11.4", "DESeq2 v1.40.2").',
          reasoning: 'Software updates frequently change default parameters, fix bugs, or alter algorithms. Version differences are a common source of irreproducible results.'
        },
        {
          condition: (details) => !hasSubCategory(details, 'seedIndicators'),
          prompt: 'If any stochastic methods were used (e.g., random forest, bootstrapping, MCMC, neural network training), please report the random seed(s) used.',
          reasoning: 'Random seeds make stochastic analyses exactly reproducible. Without them, results will vary between runs, making verification impossible.'
        }
      ],
      fallback: {
        prompt: 'Software information is largely missing. Please document all software tools with their version numbers, and include random seeds if any stochastic methods were used.',
        reasoning: 'Complete software documentation (name + version + seed) is a minimum standard for computational reproducibility.'
      }
    },

    data: {
      prompts: [
        {
          condition: (details) => !hasSubCategory(details, 'repositories'),
          prompt: 'Please specify where the raw and processed data are deposited (e.g., GEO, SRA, Zenodo, Dryad, GitHub) and provide the accession numbers or DOIs.',
          reasoning: 'Data availability is a prerequisite for independent verification. Public repositories with persistent identifiers ensure long-term accessibility.'
        },
        {
          condition: (details) => !hasSubCategory(details, 'accessPatterns'),
          prompt: 'Please provide clear data access instructions, including any access restrictions, required permissions, or controlled-access procedures.',
          reasoning: 'Even when data is deposited, unclear access instructions can prevent replication. This is especially critical for human subjects data with access controls.'
        },
        {
          condition: (details) => !hasSubCategory(details, 'formatKeywords'),
          prompt: 'Please specify the file formats of your datasets (e.g., CSV, FASTQ, BAM, HDF5) and describe the data structure (columns, variables, units).',
          reasoning: 'Format and structure documentation reduces barriers to data reuse and prevents misinterpretation of variables.'
        }
      ],
      fallback: {
        prompt: 'Data availability information is insufficient. Please provide repository locations, accession numbers or DOIs, file formats, and any access restrictions for all datasets used and generated.',
        reasoning: 'Without data access details, the study cannot be independently verified, undermining scientific credibility and violating most journal data policies.'
      }
    },

    parameters: {
      prompts: [
        {
          condition: () => true, // Always generate if category is absent
          prompt: 'Please ensure all experimental parameters are reported with exact values and units. This includes temperatures, times, concentrations, volumes, speeds, wavelengths, and any thresholds or cutoffs used.',
          reasoning: 'Vague parameter reporting (e.g., "room temperature" instead of "22 ± 1°C") is the single most common cause of failed replications in experimental science.'
        }
      ],
      fallback: {
        prompt: 'Critical experimental parameters appear to be missing or incompletely specified. Please provide exact numerical values with units for all conditions (temperature, time, concentration, pH, speed, etc.).',
        reasoning: 'Precise parameters are non-negotiable for reproducibility. Every experimental condition must be quantified for another lab to replicate the protocol.'
      }
    },

    statisticalTests: {
      prompts: [
        {
          condition: (details) => !hasSubCategory(details, 'tests'),
          prompt: 'Please name the specific statistical tests used for each comparison or analysis (e.g., "two-tailed unpaired Student\'s t-test", "one-way ANOVA with Tukey\'s post-hoc test").',
          reasoning: 'The choice of statistical test affects the validity of conclusions. Reviewers and replicators need this information to assess whether the analysis is appropriate.'
        },
        {
          condition: (details) => !hasSubCategory(details, 'alphaIndicators'),
          prompt: 'Please specify the significance threshold (alpha level) used, and indicate whether tests were one-tailed or two-tailed.',
          reasoning: 'The alpha level defines what constitutes a "significant" result. Without it, p-values cannot be properly interpreted, and the risk of false positives is unknown.'
        },
        {
          condition: (details) => !hasSubCategory(details, 'softwareUsed'),
          prompt: 'Please indicate which statistical software or package was used to perform each analysis.',
          reasoning: 'Different software packages may use different algorithms, default settings, or rounding behaviors for the same test, potentially producing different results.'
        }
      ],
      fallback: {
        prompt: 'Statistical analysis details are insufficiently reported. Please specify the exact tests used, significance levels (alpha), correction methods for multiple comparisons, and the software used for analysis.',
        reasoning: 'Incomplete statistical reporting prevents assessment of analytical validity and is a major barrier to both replication and peer review.'
      }
    }
  };

  // ---------- Helper Functions ----------

  function hasSubCategory(details, subCatName) {
    return details.some(d => d.subCategory === subCatName && d.matches.length > 0);
  }

  /**
   * Generate prompts for a single absent category
   */
  function generatePromptsForCategory(categoryKey, checklistResult) {
    const template = PROMPT_TEMPLATES[categoryKey];
    if (!template) return [];

    const details = checklistResult.details || [];
    const prompts = [];

    // Check specific sub-prompts
    for (const sub of template.prompts) {
      if (sub.condition(details)) {
        prompts.push({
          priority: PRIORITY_MAP[categoryKey] || 'Medium',
          category: Checklist.CATEGORY_INFO[categoryKey]?.label || categoryKey,
          prompt: sub.prompt,
          reasoning: sub.reasoning
        });
      }
    }

    // If no specific prompts triggered, use fallback
    if (prompts.length === 0) {
      prompts.push({
        priority: PRIORITY_MAP[categoryKey] || 'Medium',
        category: Checklist.CATEGORY_INFO[categoryKey]?.label || categoryKey,
        prompt: template.fallback.prompt,
        reasoning: template.fallback.reasoning
      });
    }

    return prompts;
  }

  /**
   * Main function: Generate all missing info prompts from checklist results
   */
  function generate(checklistResults) {
    if (!checklistResults || !checklistResults.categories) {
      return [];
    }

    const allPrompts = [];

    for (const [categoryKey, result] of Object.entries(checklistResults.categories)) {
      if (result.status === 'Absent') {
        const prompts = generatePromptsForCategory(categoryKey, result);
        allPrompts.push(...prompts);
      }
    }

    // Sort by priority: High > Medium > Low
    const priorityOrder = { High: 0, Medium: 1, Low: 2 };
    allPrompts.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

    return allPrompts;
  }

  // Public API
  return { generate };

})();
