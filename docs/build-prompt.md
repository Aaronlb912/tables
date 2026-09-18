# TARGET 2026-09-17

Editable tables. Named columns. Click a cell. Add a row. Keep more than
one table. JSON in, JSON out. Drop `src/lib/` into a React app you
already have.

Prompt file (do not wait for a paste):
`C:\Users\aaron\OneDrive\Documents\prompts\other prompts\tables-expand-6-prompt.md`

Ship later:
`C:\Users\aaron\OneDrive\Documents\prompts\multi-session-build-prompt-react.md`

Kind: table editor. Not a search page. Not a board. Not a calendar.

Local URL: http://127.0.0.1:48721/
Repo: https://github.com/Aaronlb912/tables

Pages:
- Table list: open, new blank, duplicate, remove. Reset sample.
- Table: grid, click to edit, add one or several blank rows on
  the grid, type your own headers, Open a row,
  load and download JSON (this table or all tables), paste CSV,
  copy CSV, print, drag a row or a column, resize a column.
  Escape cancels a cell or a page. Quiet Remove. Undo after Remove
  on a row or a column. Qty total. Bad number misses. Sticky
  header and first column. Hide a column. Filter a column.
  Check rows. Add CSV onto the open table. Search highlight.
- Row page: every column as a field. Notes is a longer box.

Auth: none.

Sample: Willow Court Nursery in `src/lib/sample-table.js`. Fake names.
Empty bench is the empty table.

## Session plan

- [x] Session 1: scaffold, sample table with named columns, add a
      row, edit cells, several tables, JSON download, demo running.
- [x] Session 2: sort, search, duplicate a row from the row, miss
      on a blank table name, CSV in and out.
- [x] Session 3: add/rename/remove columns, persist polish, old
      JSON still loads, empty table and bad file.
- [x] Expand A: row page. Add row opens a page. Open a row. Notes
      is a longer box. Escape cancels. Miss if the first column is
      blank.
- [x] Expand B: Qty total and a bad-number miss.
- [x] Expand C: drag a row, drag a column. Order is the data.
- [x] Expand D: paste CSV from the clipboard. Print this table.
- [x] Expand E: CSS pass. Prove a junk JSON file in the browser.
- [x] Expand F: Tab and Enter through cells.
- [x] Expand G: sticky header and first column.
- [x] Expand H: copy this table or one row as CSV.
- [x] Expand I: drag a column edge to resize.
- [x] Expand J: undo a removed column, wrap notes, CSS.
- [x] Expand K: hide a column on the grid.
- [x] Expand L: filter a column.
- [x] Expand M: check rows and remove selected.
- [x] Expand N: append CSV onto the open table.
- [x] Expand O: search highlight and CSS.
- [x] Expand P: sheet chrome, title then tools, list cards.
- [x] Expand Q: header filter stack, checks, sticky row actions.
- [x] Expand R: 390 width and row page fields.
- [x] Expand S: paper secondary buttons, dark primary.
- [x] Expand T: header tools visible at rest.
- [x] Expand U: shorter help, more air on the sheet.
- [x] Expand V: add one or several blank rows on the grid.
- [x] Expand W: type your own headers, or a few at once.
- [ ] Session ship: screenshots, demo video, README Demo, LinkedIn
      draft, SHIPPED.

## This session

Expand V-W: add rows on the grid and your own headers. Landed.

## Next session

Ship later, when he asks.

## Usefulness check

1. Who else? A shop or crew that already has a React app and keeps a
   count of plants, parts, or jobs in a table. They finish "these
   rows, these columns, this file."
2. Their data? Yes. Pass a workspace or a sheet object, or load JSON.
   Rows and column names are theirs.
3. Make it theirs? Yes. Table title, column labels, CSS in
   `src/lib/table.css`.
4. Take it? Yes. Copy `src/lib/` into their React `src/` and import
   `Workspace` or `Table`.
5. No account? Yes. No signup. No npm publish.
6. Coworker test? Yes. Zip `src/lib/`. They drop it in and import.
7. Keep a copy? Yes. Download JSON. The useful output is also the
   component running in their app with their rows.
8. Miss and recover? Yes. Blank table name. Bad file. Empty table.
   Last table. Then add a row or load a good file.
9. README says how? Session 1: who, run, local URL. Full copy
   `src/lib/`, import, props, stills, and player before SHIPPED.

## Go deep (done-means)

A person can add, open, edit, and remove their own rows through the
component. A row has more than a title (SKU, plant, size, qty, unit,
bin, notes on the sample). They can use the sample or start blank.
Work stays after a refresh in the demo, and JSON download works.
Host apps get `value` / `onChange`. They can find a row later
(search, session 2). A miss is recoverable. Title, names, and CSS
can change. `src/lib/` copies into an existing React app. Rename.
Duplicate a table. Escape cancels a cell. Empty table says what to
do next. Quiet Remove. Old JSON still loads.

## SHIPPED means

Session plan checked. Usefulness 1-9 all yes. README has copy
`src/lib/`, import, props, three tool screenshots, and a github.com
player URL. Log marked SHIPPED. This product appended to the
multi-session React prompt's shipped list. No second product in this
repo. Do not SHIPPED until screenshots and video.
