## Winning coalition size (W) — reproduces Bueno de Mesquita & Smith (2022).
##
## W is the mean of four z-scored V-Dem components, with the z-scores computed
## across all country-year observations:
##   1. v2elembaut          (election-monitoring autonomy)
##   2. v2psoppaut          (opposition-party autonomy)
##   3. v2psbars            (barriers to political-party participation)
##   4. -1 * max(v2x_ex_hereditary, v2x_ex_military, v2x_ex_party)
##
## Higher W => larger winning coalition.

library(arrow)
library(dplyr)
library(tidyr)
library(ggplot2)

source("~/dev/gl-design/skills/gl-ggplot/assets/theme_gl.R")
gl_setup()

vdem <- read_parquet(
    "/home/taimur/dev/shared-data/vdem/vdem.parquet",
    col_select = c(
        "country_name", "year",
        "v2elembaut", "v2psoppaut", "v2psbars",
        "v2x_ex_hereditary", "v2x_ex_military", "v2x_ex_party"
    )
)

zscore <- function(x) (x - mean(x, na.rm = TRUE)) / sd(x, na.rm = TRUE)

w <- vdem |>
    mutate(
        closed_succession = -pmax(
            v2x_ex_hereditary, v2x_ex_military, v2x_ex_party,
            na.rm = FALSE
        ),
        z_elembaut = zscore(v2elembaut),
        z_oppaut   = zscore(v2psoppaut),
        z_bars     = zscore(v2psbars),
        z_succ     = zscore(closed_succession)
    ) |>
    rowwise() |>
    mutate(
        W = mean(c(z_elembaut, z_oppaut, z_bars, z_succ), na.rm = FALSE)
    ) |>
    ungroup()

countries <- c(
    "Pakistan", "Cambodia", "Vietnam", "United States of America",
    "Burma/Myanmar", "Burundi", "Bangladesh", "India",
    "Argentina", "Azerbaijan", "Venezuela", "Bolivia", "Ecuador", "Morocco"
)

plot_df <- w |>
    filter(country_name %in% countries, year >= 1945, !is.na(W)) |>
    mutate(
        country_name = recode(country_name,
            "United States of America" = "USA",
            "Burma/Myanmar" = "Myanmar"
        ),
        country_name = factor(country_name, levels = c(
            "USA", "Argentina", "Bolivia", "Ecuador",
            "Venezuela", "Morocco", "Azerbaijan", "India",
            "Bangladesh", "Pakistan", "Myanmar", "Cambodia",
            "Vietnam", "Burundi"
        ))
    )

p_facet <- ggplot(plot_df, aes(x = year, y = W, color = country_name)) +
    geom_hline(yintercept = 0, color = gl$text_muted, linewidth = 0.3) +
    geom_line(linewidth = 0.7) +
    facet_wrap(~ country_name, ncol = 4) +
    scale_x_continuous(breaks = c(1960, 1990, 2020)) +
    guides(color = "none") +
    labs(
        title = "Winning coalition size (W), 1945–2025",
        subtitle = "BdM & Smith (2022) index: mean of four z-scored V-Dem components",
        x = NULL,
        y = "W (z-score units)",
        caption = "Source: V-Dem v16. Higher W = larger winning coalition."
    )

save_fig("full_tall", "winning_coalition_lines.png", plot = p_facet)

p_over <- ggplot(plot_df, aes(x = year, y = W, color = country_name)) +
    geom_hline(yintercept = 0, color = gl$text_muted, linewidth = 0.3) +
    geom_line(linewidth = 0.7) +
    labs(
        title = "Winning coalition size (W), 1945–2025",
        subtitle = "BdM & Smith (2022) index: mean of four z-scored V-Dem components",
        x = NULL,
        y = "W (z-score units)",
        color = NULL,
        caption = "Source: V-Dem v16. Higher W = larger winning coalition."
    )

save_fig("full", "winning_coalition_overlay.png", plot = p_over)

readr::write_csv(
    plot_df |> select(country_name, year, W,
                                        z_elembaut, z_oppaut, z_bars, z_succ),
    "outputs/winning_coalition.csv"
)

cat("done. obs with non-NA W:", sum(!is.na(w$W)), "/", nrow(w), "\n")
