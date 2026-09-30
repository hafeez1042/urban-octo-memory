# Styling

The interface follows the approved UI reference/design (if the project has one, e.g. under
`docs/ui/`). When a screen is ambiguous, open it — it is the design of record, not a mood
board.

## Layers

```
src/index.css              # entry: imports fonts + tokens, then Tailwind; base element styles
src/styles/fonts.css       # @font-face for the project's self-hosted fonts
src/styles/tokens.css      # every colour, font, radius and shadow as a CSS custom property
src/styles/app.css         # the shell and page styles (imported by App.tsx)
src/styles/auth.css        # the sign-in screen (imported by the auth feature)
public/fonts/*.woff2       # the font files themselves, served at /fonts/…
```

## Rules

- **Take every value from `tokens.css`.** No literal hex, no ad-hoc `rgba()`, no one-off
  radius. If a value is missing, add a token — a hard-coded colour is invisible the day
  the palette changes.
- **Token names avoid Tailwind's theme keys.** Tailwind v4 emits `--radius-md`,
  `--shadow-sm`, `--font-mono` into `:root`, so app tokens use `--ui-radius-*`,
  `--ui-shadow-*` and `--font-numeric`; a same-named token resolves to itself and breaks.
- **Tailwind's theme is mapped onto the tokens** in `index.css`, so a shadcn primitive
  (`bg-background`, `border-border`) and the shell CSS agree. Never introduce a second
  palette in `@theme`.
- **Fonts are self-hosted.** The project's fonts (default: Inter for UI text and a numeric
  face for counters, times and metadata — replaceable). Never add a `fonts.googleapis.com`
  import: a corporate network or air-gapped deployment silently falls back to a system
  font, and third-party calls are not allowed. Add a subset file to `public/fonts/` and a `@font-face` instead.
- **Font `url()`s are absolute (`/fonts/…`), never relative.** Tailwind's PostCSS plugin
  inlines `fonts.css` into `index.css` before Vite's URL rewriter runs, so a relative path
  survives unrewritten; in dev it resolves against the document base and the SPA fallback
  returns `index.html`, which the browser cannot decode as a font. The symptom is a silent
  fall back to `system-ui` in dev while the production build looks correct. Preload the latin
  subsets from `index.html` so first paint is not a system face.
- **Numbers that line up use `font-variant-numeric: tabular-nums`** — references/ids,
  counters, times. Proportional digits make a list of times look ragged.
- Class names are shared between the stylesheet and the components. Renaming one means
  renaming both; grep before you rename.
- Interactive elements get a hover state and a visible `:focus-visible` ring. The base
  ring is set once in `index.css`; do not restyle it per component.
- Responsive: the navigation rail becomes a drawer under 900px, and tables drop columns by
  priority under 660px — the identifying columns survive longest. Cells that
  truncate need `min-width: 0` on both the grid cell and the inner block.
- Status colour is semantic and fixed: red = error/failed, amber = warning, blue = info/in
  progress, grey = inactive. Never reuse those hues for decoration.
