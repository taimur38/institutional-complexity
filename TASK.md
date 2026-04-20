# Task: Build Institutional Complexity Analysis

You are building an R Markdown analysis that applies economic complexity methodology to V-Dem institutional data. Create the following in this repo:

1. A README.md explaining the project
2. An RMarkdown file `institutional_complexity.Rmd` that does the following:

## Data
- Download V-Dem data from the vdemdata R package (or from their GitHub CSV if needed). Use the latest available version.
- Select a curated set of ~100-200 institutional/governance indicators. Focus on:
  - Rule of law indicators
  - Judicial independence
  - Bureaucratic quality / meritocratic recruitment
  - Property rights
  - Media freedom
  - Electoral integrity
  - Civil liberties
  - Legislative constraints
  - Anti-corruption measures
  - State capacity indicators
  - Academic freedom
  - etc.
- Filter to the most recent year with good coverage (probably 2023 or 2022)
- Each indicator should be documented with its V-Dem code and description

## Binarization
- V-Dem indicators are typically on 0-4 ordinal scales or continuous 0-1 interval scales
- For ordinal (0-4): binarize at >= 3 (strong presence)
- For interval (0-1): binarize at >= 0.5 OR use an RCA-like approach where you compare each country value to the global mean
- Document the binarization choices clearly
- Show the resulting country x institution matrix dimensions and density

## Complexity Calculation
- Build the Mcp bipartite matrix (countries x institutional features)
- Calculate diversity (kc,0) and ubiquity (kp,0)
- Implement the Method of Reflections (iterate to convergence, ~20 iterations)
- Also implement the eigenvalue method (second eigenvector of Mcc_tilde or Mpp_tilde) for robustness
- Produce ECI (Economic Complexity Index -> here "Institutional Complexity Index" for countries)
- Produce PCI (Product Complexity Index -> here "Institutional Feature Complexity" for features)
- Show top/bottom countries and features by complexity

## Proximity and Relatedness
- Calculate proximity between institutional features: phi_pp_prime = min(P(p|p_prime), P(p_prime|p)) -- the conditional probability approach from Hidalgo et al.
- Calculate proximity between countries similarly
- Build the institution space (network of institutional features connected by proximity)
- Build the country space (network of countries connected by institutional proximity)

## UMAP Visualization
- Use UMAP to embed the institution proximity matrix into 2D
- Color-code institutions by category (rule of law, elections, civil liberties, etc.)
- Size nodes by ubiquity or complexity
- Use UMAP to embed the country proximity matrix into 2D
- Color-code countries by region (use V-Dem region codes or continent)
- Size nodes by institutional complexity score
- Make the plots publication-quality with ggplot2

## Additional Visualizations
- Heatmap of the Mcp matrix (clustered)
- Scatter: ECI vs GDP per capita (merge in WDI data)
- Scatter: ECI vs V-Dem liberal democracy index
- Distribution of ECI scores by world region

## Style
- Use tidyverse throughout
- Clear section headers and narrative text explaining each step
- The tone should be analytical but accessible -- this is exploratory research
- Include a discussion section at the end about what the results suggest

Required R packages: vdemdata, tidyverse, uwot (for UMAP), ggrepel, countrycode, WDI, pheatmap, igraph, RColorBrewer, knitr, DT

Make sure the Rmd knits cleanly. Use eval=TRUE for everything, with caching where appropriate for expensive computations.

Put everything in the current directory.
