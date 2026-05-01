#!/usr/bin/env Rscript
# Export country-space trajectory data for the React country-profile app.
#
# Source: outputs/country_space_trajectory.csv (joint UMAP across 1975-2025
# benchmark years, produced by scratch/country_space_animation.R).
#
# Outputs:
#   apps/country-profile/public/tracks.json  — per-country observations in [0,1]
#   apps/country-profile/public/meta.json    — bounds, regions->colors, defaults
#
# The React canvas tweens between observation years with cubic-in-out at render
# time, so we ship raw observation points rather than pre-tweened frames.

suppressMessages({
  library(tidyverse)
  library(jsonlite)
})

setwd("/home/taimur/dev/institutional-complexity")

trajectory <- read_csv("outputs/country_space_trajectory.csv",
                       show_col_types = FALSE)

# -- Padded global bounds, normalize to [0,1] ---------------------------------
pad <- 0.05
x_rng <- range(trajectory$UMAP1)
y_rng <- range(trajectory$UMAP2)
x_pad <- diff(x_rng) * pad
y_pad <- diff(y_rng) * pad
x_lim <- c(x_rng[1] - x_pad, x_rng[2] + x_pad)
y_lim <- c(y_rng[1] - y_pad, y_rng[2] + y_pad)

trajectory <- trajectory %>%
  mutate(
    x = (UMAP1 - x_lim[1]) / diff(x_lim),
    # Flip y so canvas y=0 (top) corresponds to high UMAP2 (visual top).
    y = 1 - (UMAP2 - y_lim[1]) / diff(y_lim)
  )

# -- Region colors: GL categorical palette, alphabetical regions --------------
# Matches the default ggplot ordering used by the existing animation.
gl_palette <- c("#266798", "#C64646", "#36B250", "#EAC218", "#D1852A",
                "#52E2DE", "#A42DE2", "#7C6760", "#757777")
regions <- sort(unique(trajectory$region))
region_colors <- setNames(gl_palette[seq_along(regions)], regions)

# -- Per-country tracks --------------------------------------------------------
tracks <- trajectory %>%
  arrange(country_name, year) %>%
  group_by(country_name, region) %>%
  summarise(
    observations = list(map2(year, map2(x, y, c),
                             ~ list(year = .x, x = .y[1], y = .y[2]))),
    .groups = "drop"
  ) %>%
  transmute(
    name = country_name,
    region,
    observations
  )

tracks_list <- pmap(tracks, function(name, region, observations) {
  list(name = name, region = region, observations = observations)
})

meta <- list(
  year_range = c(min(trajectory$year), max(trajectory$year)),
  observation_years = sort(unique(trajectory$year)),
  default_duration_seconds = 18,
  default_fps = 30,
  easing = "cubic-in-out",
  regions = as.list(region_colors),
  source = "outputs/country_space_trajectory.csv",
  notes = paste(
    "Coordinates normalized to [0,1] using padded global UMAP bounds.",
    "y is flipped so 0 = top of canvas."
  )
)

dir.create("apps/country-profile/public", recursive = TRUE, showWarnings = FALSE)
write_json(tracks_list,
           "apps/country-profile/public/tracks.json",
           auto_unbox = TRUE, digits = 5)
write_json(meta,
           "apps/country-profile/public/meta.json",
           auto_unbox = TRUE, pretty = TRUE)

cat("Wrote tracks for", length(tracks_list), "countries\n")
cat("Regions:", length(regions), "->", paste(regions, collapse = ", "), "\n")
