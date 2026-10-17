# UI and UX

Every screen follows established UI/UX practice and is laid out deliberately. Visual values
come from `styling.md`; this file covers arrangement and behaviour.

## Layout and arrangement

- **One clear purpose per screen.** The primary action sits in a predictable place (page
  header, top right) and is the only primary-styled button in view.
- **Visual hierarchy**: page title → section headings → content. Size, weight and spacing
  signal importance, not colour alone.
- **Align to a grid.** Edges, labels and inputs line up; no element floats off-axis.
  Related items group together, unrelated groups get more space between them.
- **Consistent spacing rhythm** from the `--space-*` scale — the same gap for the same
  relationship across every page.
- **Forms**: labels above inputs, one column unless fields are short and related, required
  fields marked, related fields grouped under a heading, actions at the bottom aligned
  consistently.
- **Tables and lists**: identifying column first, numbers right-aligned with tabular
  digits, row actions at the end, sticky header on long lists, pagination or virtual
  scroll — never an unbounded list.
- **Dense data stays readable**: truncate with a tooltip rather than wrap unpredictably;
  never let content overflow its container or cause horizontal page scroll.
- Reuse existing layout components (`components/layout`, `components/common`) before
  building a new arrangement; the same kind of page looks the same everywhere.

## Minimal actions

- **No unnecessary buttons, links or actions.** Every element earns its place; if it doesn't
  serve the screen's purpose, remove it. Clutter breaks the UI.
- **Place every element precisely where it's needed** — no redundant controls, no
  duplicate actions, no explanatory filler. Users don't need hand-holding.
- **Show only the primary action(s) inline.** Secondary and rare actions go into a
  "More" (⋯) menu.
- **Delete is never a visible button in list views** (table, stack, card grid). It lives
  inside the row/item "More" menu, styled as destructive and placed last.
- Destructive or irreversible actions always ask for confirmation naming the item;
  routine safe actions don't.

## States

- Every data view handles **loading** (skeleton matching the final layout), **empty**
  (explains why and offers the next action), **error** (plain message plus retry) and
  **success**.
- Layout does not jump when data arrives; reserve space for async content.
- Destructive actions ask for confirmation naming the item; reversible ones prefer undo.
- Every write gives feedback: pending state on the button, toast or inline message on
  completion, field-level messages on validation failure.

## Interaction

- Clickable things look clickable; disabled things explain why (tooltip or helper text).
- Target size at least 32px (44px on touch). Don't place destructive and primary actions
  side by side without separation.
- Keep users' context: preserve filters, scroll and form input across navigation and
  errors; deep-linkable state lives in the URL.
- Use plain, consistent wording — the same term for the same thing everywhere; buttons
  say what they do ("Submit appraisal", not "OK").

## Accessibility

- Semantic elements (`button`, `nav`, `table`, `label`) over `div` with handlers.
- Full keyboard path: logical tab order, focus moved into dialogs and returned on close,
  `Esc` closes overlays.
- Text contrast meets WCAG AA; status is never conveyed by colour alone (add icon or text).
- Every input has a label; icons-only buttons have `aria-label`.

## Responsive

- Design works from 360px to wide desktop; follow breakpoints in `styling.md`.
- On narrow screens stack columns, keep the primary action reachable, and drop
  low-priority table columns first.

## Before calling UI done

- Check the screen at mobile, tablet and desktop widths.
- Walk loading, empty, error and long-content cases.
- Tab through it with the keyboard.
- Compare against `docs/ui/` reference when one exists.
