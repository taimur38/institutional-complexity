// Growth Lab design tokens (mirrors ~/dev/gl-design/CLAUDE.md and
// theme_gl.R). Colors live here because SVG strokes/fills can't read
// CSS custom properties through Tailwind utility classes — recharts
// needs concrete hex values. CSS-variable tokens live in index.css for
// HTML/Tailwind use; this module keeps the same values reachable from
// chart code without scattering hex literals.

export const GL = {
  // Neutrals
  text: "#333333",
  muted: "#7c7c7c",
  border: "#dcdcdc",
  bg: "#f3f3f3",
  // Brand / highlight
  blue: "#266798",
  highlight: "#C64646",
  // Categorical palette positions 3-9 (palette[0] = blue, [1] = highlight)
  green: "#36B250",
  yellow: "#EAC218",
  orange: "#D1852A",
  cyan: "#52E2DE",
  purple: "#A42DE2",
  brown: "#7C6760",
  greyDeep: "#757777",
} as const;

// GL 9-color categorical palette — matches gl_palettes$categorical in
// theme_gl.R. Use this when you want the GL-default discrete colour
// ordering.
export const GL_PALETTE = [
  GL.blue,
  GL.highlight,
  GL.green,
  GL.yellow,
  GL.orange,
  GL.cyan,
  GL.purple,
  GL.brown,
  GL.greyDeep,
] as const;

// Peer-overlay palette: blue is reserved for the focus country, so
// peers cycle through the remaining 8.
export const GL_PEER_PALETTE = GL_PALETTE.slice(1);

// Sector palette used by the cambodia analysis and the SectoralChart.
// Not an Atlas HS sector — these are WDI 1-digit sectors.
export const GL_SECTORS = {
  agriculture: GL.yellow,
  industry: GL.green,
  services: GL.blue,
} as const;
