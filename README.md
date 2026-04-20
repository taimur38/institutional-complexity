# Institutional Complexity Analysis

Applying economic complexity methodology (Hidalgo & Hausmann, 2009) to V-Dem institutional data to measure the "complexity" of countries' institutional portfolios.

## Concept

Economic complexity theory was developed to understand why some countries are richer than others by looking at the structure of what they export. The key insight: countries that produce many products that few other countries can produce tend to be more sophisticated economies.

This project applies the same logic to **institutions and governance**:
- Instead of countries × products, we build a countries × institutional features matrix
- Instead of Revealed Comparative Advantage in exports, we binarize V-Dem governance indicators
- We calculate an **Institutional Complexity Index (ICI)** analogous to the Economic Complexity Index
- We build an **institution space** showing which governance features tend to co-occur

## What's in this repo

- `institutional_complexity.Rmd` — The full analysis in R Markdown
- `TASK.md` — Original task specification

## Data Sources

- [V-Dem (Varieties of Democracy)](https://www.v-dem.net/) — Institutional and governance indicators
- [World Development Indicators](https://databank.worldbank.org/source/world-development-indicators) — GDP per capita for validation

## Requirements

R packages needed:

```r
install.packages(c("tidyverse", "uwot", "ggrepel", "countrycode", "WDI",
                   "pheatmap", "igraph", "RColorBrewer", "knitr", "DT"))

# V-Dem data package (from GitHub)
remotes::install_github("vdeminstitute/vdemdata")
```

## References

- Hidalgo, C. A., & Hausmann, R. (2009). The building blocks of economic complexity. *PNAS*, 106(26), 10570-10575.
- Coppedge, M. et al. (2024). V-Dem Codebook. Varieties of Democracy (V-Dem) Project.
