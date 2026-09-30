# React Components

- Functional components only; typed with an explicit props interface (`IFooProps`)
- Named exports only — no `export default`
- Destructure props; no `any`
- Extract complex logic to custom hooks and split large pages into feature components —
  keep the component body readable. One JSX expression per line; a page is not a one-liner.
- Self-closing tags when there are no children; fragments `<>` over pointless `<div>`s
- Static content that never changes (column headers, legends, matrix rows) goes in a
  `UPPER_SNAKE_CASE` constant above the component, not inline in the JSX
- The app shell and pages are built from the hand-written classes in
  `styles/app.css`, which mirror the approved UI reference. Interactive primitives
  (dialog, select, tooltip, toast, form controls) come from
  `frontend/web/src/components/ui/*` (shadcn/Radix) — don't re-implement those, and style
  them through the tokens rather than with new colours
- Loading and error states from `useQuery` are handled in the consuming component; a page
  never renders `undefined` data as an empty layout
- Every interactive element is reachable by keyboard and carries an accessible name
  (`aria-label` on icon-only buttons)
