/* ============================================================
   R3A — Reproducibility Checklist Generator
   Evaluates Methods text against 6 reproducibility categories
   ============================================================ */

const Checklist = (() => {

  // ---------- Keyword Dictionaries ----------

  const KEYWORDS = {

    materials: {
      reagents: [
        'reagent', 'chemical', 'compound', 'solution', 'buffer', 'medium', 'media',
        'antibody', 'primer', 'probe', 'enzyme', 'substrate', 'inhibitor',
        'agonist', 'antagonist', 'ligand', 'peptide', 'protein', 'nucleotide',
        'plasmid', 'vector', 'construct', 'kit', 'assay',
        'serum', 'plasma', 'lysate', 'homogenate',
        'stain', 'dye', 'fluorophore', 'chromogen',
        'antibiotic', 'growth factor', 'cytokine',
        'DMSO', 'PBS', 'EDTA', 'SDS', 'tris', 'HEPES',
        'ethanol', 'methanol', 'chloroform', 'acetone',
        'fetal bovine serum', 'FBS', 'BSA', 'DMEM', 'RPMI',
        'agarose', 'acrylamide', 'polyacrylamide',
        'siRNA', 'shRNA', 'sgRNA', 'cDNA', 'mRNA',
        'cell line', 'strain', 'isolate', 'specimen', 'sample',
        'tissue', 'biopsy', 'blood', 'urine', 'saliva'
      ],
      identifiers: [
        'catalog', 'cat#', 'cat.', 'lot', 'batch', 'CAS',
        'RRID', 'product number', 'item number', 'SKU',
        'ATCC', 'Addgene', 'GenBank', 'accession'
      ],
      suppliers: [
        'Sigma', 'Aldrich', 'Sigma-Aldrich', 'Merck', 'Fisher',
        'Thermo', 'ThermoFisher', 'Invitrogen', 'Life Technologies',
        'Gibco', 'Abcam', 'Cell Signaling', 'Bio-Rad', 'Qiagen',
        'Roche', 'Millipore', 'Corning', 'BD', 'Becton Dickinson',
        'Santa Cruz', 'Promega', 'NEB', 'New England Biolabs',
        'Agilent', 'Illumina', 'Applied Biosystems', 'Eppendorf',
        'Sartorius', 'GE Healthcare', 'Cytiva', 'Biolegend',
        'R&D Systems', 'PeproTech', 'Tocris', 'MedChemExpress',
        'Jackson ImmunoResearch', 'Vector Laboratories',
        'purchased from', 'obtained from', 'supplied by', 'sourced from'
      ]
    },

    equipment: {
      instruments: [
        'microscope', 'spectrophotometer', 'spectrometer', 'chromatograph',
        'centrifuge', 'ultracentrifuge', 'incubator', 'shaker',
        'thermocycler', 'PCR machine', 'qPCR', 'real-time PCR',
        'flow cytometer', 'cytometer', 'FACS', 'sorter',
        'sequencer', 'MiSeq', 'HiSeq', 'NovaSeq', 'NextSeq',
        'plate reader', 'microplate reader', 'luminometer',
        'balance', 'scale', 'pH meter', 'osmometer',
        'electrophoresis', 'gel imager', 'blotter', 'transilluminator',
        'autoclave', 'biosafety cabinet', 'laminar flow hood',
        'cryostat', 'microtome', 'homogenizer', 'sonicator',
        'mass spectrometer', 'LC-MS', 'GC-MS', 'HPLC', 'FPLC',
        'NMR', 'X-ray', 'MRI', 'CT scanner', 'PET scanner',
        'confocal', 'electron microscope', 'SEM', 'TEM', 'AFM',
        'robot', 'liquid handler', 'pipette', 'multichannel',
        'camera', 'detector', 'sensor', 'probe',
        'workstation', 'cluster', 'GPU', 'server',
        'bioanalyzer', 'nanodrop', 'qubit',
        'electroporator', 'nucleofector',
        'scanner', 'densitometer'
      ],
      identifiers: [
        'model', 'serial', 'firmware', 'hardware version',
        'manufactured by', 'made by'
      ],
      manufacturers: [
        'Zeiss', 'Nikon', 'Olympus', 'Leica', 'Bruker',
        'Beckman', 'Beckman Coulter', 'Eppendorf', 'Thermo',
        'Bio-Rad', 'Agilent', 'Waters', 'Shimadzu',
        'PerkinElmer', 'Molecular Devices', 'BioTek', 'Tecan',
        'BD Biosciences', 'Sony', 'Miltenyi',
        'Oxford Nanopore', 'PacBio', 'Illumina',
        'Hamilton', 'Labcyte', 'NVIDIA', 'Dell', 'HP',
        'Applied Biosystems', 'Roche', 'Hamamatsu'
      ]
    },

    software: {
      names: [
        'R ', ' R,', ' R.', '(R)', 'RStudio', 'R Studio',
        'Python', 'MATLAB', 'SAS', 'SPSS', 'Stata', 'JMP',
        'Prism', 'GraphPad', 'Origin', 'OriginPro',
        'ImageJ', 'FIJI', 'Fiji', 'CellProfiler', 'Icy',
        'GATK', 'Picard', 'SAMtools', 'BCFtools', 'BEDTools',
        'BWA', 'Bowtie', 'Bowtie2', 'STAR', 'HISAT', 'HISAT2',
        'Salmon', 'Kallisto', 'featureCounts', 'HTSeq',
        'DESeq2', 'edgeR', 'limma', 'Seurat', 'Scanpy',
        'BLAST', 'Clustal', 'MUSCLE', 'MAFFT',
        'PyMOL', 'Chimera', 'ChimeraX', 'VMD', 'GROMACS', 'AMBER',
        'NAMD', 'AutoDock', 'Rosetta', 'AlphaFold',
        'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'sklearn',
        'pandas', 'NumPy', 'SciPy', 'matplotlib', 'seaborn', 'ggplot2',
        'Jupyter', 'Conda', 'Anaconda', 'Bioconductor',
        'Excel', 'Microsoft Office',
        'FlowJo', 'FCS Express', 'Cytobank',
        'Trimmomatic', 'FastQC', 'MultiQC', 'Cutadapt',
        'SPAdes', 'Velvet', 'Canu', 'Flye',
        'GSEA', 'DAVID', 'Enrichr', 'Metascape',
        'Cytoscape', 'Gephi', 'NetworkX',
        'QIIME', 'QIIME2', 'mothur', 'DADA2',
        'MaxQuant', 'Proteome Discoverer', 'Mascot',
        'Coot', 'Phenix', 'CCP4',
        'Qualtrics', 'SurveyMonkey', 'REDCap',
        'NVivo', 'Atlas.ti', 'MAXQDA',
        'GitHub', 'Git', 'Docker', 'Singularity',
        'Snakemake', 'Nextflow', 'CWL', 'WDL',
        'PLINK', 'VCFtools', 'ADMIXTURE',
        'SPM', 'FSL', 'FreeSurfer', 'ANTs',
        'Cellranger', 'Cell Ranger', 'Space Ranger',
        'SCENIC', 'Monocle', 'velocyto',
        'OpenCV', 'Pillow', 'scikit-image'
      ],
      versionIndicators: [
        'version', 'ver.', 'ver ', 'v.', 'v1', 'v2', 'v3', 'v4',
        /v\d+(?:\.\d+)*/i,
        /version\s*\d+/i,
        'release', 'build'
      ],
      seedIndicators: [
        'random seed', 'seed', 'set.seed', 'random_state', 'np.random.seed',
        'torch.manual_seed', 'tf.random.set_seed', 'reproducib'
      ]
    },

    data: {
      repositories: [
        'GitHub', 'GitLab', 'Bitbucket', 'Zenodo', 'Figshare',
        'Dryad', 'Mendeley Data', 'Harvard Dataverse', 'Dataverse',
        'GEO', 'Gene Expression Omnibus', 'ArrayExpress',
        'SRA', 'Sequence Read Archive', 'ENA', 'DDBJ',
        'PDB', 'Protein Data Bank', 'UniProt', 'NCBI',
        'dbGaP', 'EGA', 'TCGA', 'CCLE', 'GTEx',
        'ENCODE', '1000 Genomes', 'UK Biobank',
        'Kaggle', 'UCI', 'OpenML', 'HuggingFace',
        'AWS S3', 'Google Cloud Storage', 'Azure Blob',
        'Supplementary', 'supplementary'
      ],
      accessPatterns: [
        'available at', 'deposited in', 'accessible at', 'downloaded from',
        'can be accessed', 'hosted on', 'uploaded to', 'archived at',
        'upon request', 'on request', 'available upon',
        'DOI', 'doi.org', 'accession number', 'accession code'
      ],
      formatKeywords: [
        'CSV', 'TSV', 'JSON', 'XML', 'FASTA', 'FASTQ', 'BAM', 'SAM',
        'VCF', 'BED', 'GFF', 'GTF', 'GenBank', 'EMBL',
        'HDF5', 'h5', 'Parquet', 'Avro', 'NetCDF',
        'TIFF', 'PNG', 'JPEG', 'DICOM', 'NIfTI',
        'Excel', 'xlsx', 'xls', 'txt', 'dat',
        'RData', 'RDS', 'feather', 'pickle', 'pkl'
      ],
      urlPatterns: [
        /https?:\/\/[^\s),]+/gi,
        /doi:\s*10\.\d{4,}\/[^\s),]+/gi,
        /10\.\d{4,}\/[^\s),]+/g
      ]
    },

    parameters: {
      // Reuses extractParams from Parser — we just check if any exist
      // This section focuses on whether exact values (not just ranges) are given
      exactValuePatterns: [
        /\b\d+(?:\.\d+)?\s*(?:°[CF]|degrees)/gi,
        /\b\d+(?:\.\d+)?\s*(?:hours?|min(?:utes?)?|sec(?:onds?)?|days?|ms)\b/gi,
        /\b\d+(?:\.\d+)?\s*(?:m[Mm]|µ[Mm]|n[Mm]|p[Mm]|mg|µg|ng|ml|µl|mL|µL|mol|mmol)\b/gi,
        /\b\d+(?:\.\d+)?\s*%/g,
        /pH\s*\d+(?:\.\d+)?/gi,
        /\bn\s*=\s*\d+/gi,
        /\b\d+:\d+/g
      ],
      rangePatterns: [
        /\b\d+(?:\.\d+)?\s*[-–—]\s*\d+(?:\.\d+)?/g,
        /between\s+\d+\s+and\s+\d+/gi,
        /from\s+\d+\s+to\s+\d+/gi,
        /range\s+of\s+\d+/gi
      ]
    },

    statisticalTests: {
      tests: [
        't-test', 't test', 'Student\'s t', 'paired t', 'unpaired t', 'Welch',
        'ANOVA', 'one-way ANOVA', 'two-way ANOVA', 'repeated measures',
        'ANCOVA', 'MANOVA', 'MANCOVA',
        'chi-square', 'chi-squared', 'χ²', 'Fisher\'s exact',
        'Mann-Whitney', 'Wilcoxon', 'Kruskal-Wallis', 'Friedman',
        'Kolmogorov-Smirnov', 'Shapiro-Wilk', 'Levene',
        'Pearson', 'Spearman', 'Kendall', 'correlation',
        'regression', 'linear regression', 'logistic regression',
        'Cox regression', 'hazard ratio', 'survival analysis',
        'Kaplan-Meier', 'log-rank',
        'Bonferroni', 'Tukey', 'Dunnett', 'Scheffé', 'Holm',
        'Benjamini-Hochberg', 'FDR', 'false discovery rate',
        'bootstrap', 'permutation test', 'Monte Carlo',
        'Bayesian', 'posterior', 'prior', 'credible interval',
        'confidence interval', 'CI',
        'effect size', 'Cohen\'s d', 'eta squared', 'omega squared',
        'odds ratio', 'relative risk', 'risk ratio',
        'McNemar', 'Cochran', 'Mantel-Haenszel',
        'Bland-Altman', 'ICC', 'intraclass correlation',
        'AUC', 'ROC', 'sensitivity', 'specificity',
        'power analysis', 'sample size calculation',
        'mixed model', 'mixed effects', 'random effects', 'fixed effects',
        'GEE', 'generalized estimating',
        'PCA', 'principal component', 'factor analysis',
        'cluster analysis', 'k-means', 'hierarchical clustering',
        'normality test', 'non-parametric', 'parametric',
        'post hoc', 'post-hoc', 'multiple comparisons',
        'two-tailed', 'one-tailed', 'two-sided', 'one-sided',
        'significant', 'significance', 'statistically significant'
      ],
      alphaIndicators: [
        'α =', 'alpha =', 'α=', 'alpha=',
        'significance level', 'significance threshold',
        'p <', 'p<', 'P <', 'P<',
        'p =', 'p=', 'P =', 'P=',
        'p-value', 'P-value', 'p value'
      ],
      softwareUsed: [
        'R ', 'SPSS', 'SAS', 'Stata', 'Prism', 'GraphPad',
        'JMP', 'Minitab', 'MATLAB', 'Python', 'scipy', 'statsmodels'
      ]
    }
  };

  // ---------- Category Descriptions ----------

  const CATEGORY_INFO = {
    materials: {
      icon: 'beaker',
      label: 'Materials',
      description: 'Reagents, datasets, cell lines, organisms, and survey instruments used in the study.',
      importance: 'Exact materials (including catalog numbers and suppliers) are essential for independent replication. Different lots, grades, or sources of the same reagent can alter results.'
    },
    equipment: {
      icon: 'cpu',
      label: 'Equipment',
      description: 'Instruments, hardware, model numbers, and manufacturers.',
      importance: 'Equipment specifications (model, manufacturer, firmware) ensure measurements can be reproduced under identical conditions. Instrument-specific settings (e.g., detector sensitivity) directly impact results.'
    },
    software: {
      icon: 'code',
      label: 'Software',
      description: 'Software tools, programming languages, versions, and random seeds.',
      importance: 'Software version differences can produce different outputs. Random seeds are critical for reproducibility of any stochastic computation (simulations, ML training, bootstrapping).'
    },
    data: {
      icon: 'database',
      label: 'Data',
      description: 'Data sources, repositories, formats, access instructions, and DOIs.',
      importance: 'Accessible, well-documented data enables independent verification and meta-analyses. Without data access information, replication is impossible.'
    },
    parameters: {
      icon: 'sliders',
      label: 'Parameters',
      description: 'Exact numerical values, ranges, and units for all experimental conditions.',
      importance: 'Precise parameter values (temperature, time, concentration, etc.) are the foundation of reproducibility. Ambiguous or missing values are the #1 cause of replication failure.'
    },
    statisticalTests: {
      icon: 'chart',
      label: 'Statistical Tests',
      description: 'Statistical methods, test names, significance levels, and analysis software.',
      importance: 'Clear statistical reporting (test choice, alpha level, software) allows reviewers to assess the validity of conclusions and enables exact replication of analyses.'
    }
  };

  // ---------- Analysis Functions ----------

  /**
   * Count keyword matches in text for a given keyword list
   */
  function countMatches(text, keywords) {
    const lower = text.toLowerCase();
    const found = [];
    for (const kw of keywords) {
      if (kw instanceof RegExp) {
        const regex = new RegExp(kw.source, kw.flags);
        const matches = text.match(regex);
        if (matches) {
          found.push(...matches);
        }
      } else {
        if (lower.includes(kw.toLowerCase())) {
          found.push(kw);
        }
      }
    }
    return [...new Set(found)];
  }

  /**
   * Analyze a single category
   */
  function analyzeCategory(text, categoryKey) {
    const catKeywords = KEYWORDS[categoryKey];
    const allFound = [];

    for (const [subKey, kwList] of Object.entries(catKeywords)) {
      const matches = countMatches(text, kwList);
      if (matches.length > 0) {
        allFound.push({ subCategory: subKey, matches });
      }
    }

    const totalMatches = allFound.reduce((sum, s) => sum + s.matches.length, 0);
    const subCategoriesHit = allFound.length;
    const totalSubCategories = Object.keys(catKeywords).length;

    // Determine present/absent
    // "Present" if we find meaningful matches across subcategories
    const isPresent = totalMatches >= 2 || (totalMatches >= 1 && subCategoriesHit >= 1);

    return {
      category: categoryKey,
      ...CATEGORY_INFO[categoryKey],
      status: isPresent ? 'Present' : 'Absent',
      matchCount: totalMatches,
      subCategoriesHit,
      totalSubCategories,
      details: allFound,
      importance: CATEGORY_INFO[categoryKey].importance
    };
  }

  /**
   * Main analysis function
   */
  function analyze(methodsText) {
    if (!methodsText || typeof methodsText !== 'string') {
      return {};
    }

    const results = {};
    for (const categoryKey of Object.keys(KEYWORDS)) {
      results[categoryKey] = analyzeCategory(methodsText, categoryKey);
    }

    // Compute overall score
    const categories = Object.values(results);
    const presentCount = categories.filter(c => c.status === 'Present').length;
    const totalCategories = categories.length;
    const score = Math.round((presentCount / totalCategories) * 100);

    return {
      categories: results,
      summary: {
        presentCount,
        absentCount: totalCategories - presentCount,
        totalCategories,
        score
      }
    };
  }

  // Public API
  return { analyze, CATEGORY_INFO };

})();
