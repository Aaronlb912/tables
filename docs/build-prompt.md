# TARGET 2026-09-17

Editable tables. Named columns. Click a cell. Add a row. Keep more than
one table. JSON in, JSON out. Drop `src/lib/` into a React app you
already have.

Prompt file (do not wait for a paste):
`C:\Users\aaron\OneDrive\Documents\prompts\multi-session-build-prompt-react.md`

Kind: table editor. Not a search page. Not a board. Not a calendar.

Local URL: http://127.0.0.1:48721/
Repo: https://github.com/Aaronlb912/tables

Pages:
- Table list: open, new blank, duplicate, remove. Reset sample.
- Table: grid, click to edit, add row opens a page, Open a row,
  load and download JSON (this table or all tables). Escape cancels
  a cell or a page. Quiet Remove. Undo after Remove.
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
- [ ] Expand B: Qty total and a bad-number miss.
- [ ] Expand C: drag a row, drag a column. Order is the data.
- [ ] Expand D: paste CSV from the clipboard. Print this table.
- [ ] Expand E: CSS pass. Prove a junk JSON file in the browser.
- [ ] Session ship: screenshots, demo video, README Demo, LinkedIn
      draft, SHIPPED.

## This session

Expand A: row page. Landed.

## Next session

Expand B: Qty total and a bad-number miss.

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

## This session

Session 3: add, rename, and remove columns. Empty table still shows
the header. Blank title and blank column name miss. Last column stays.

## Next session

Screenshots, demo video, README Demo, LinkedIn draft, SHIPPED. Prove
a bad JSON file in the browser first if that is still open.

## SHIPPED means

Session plan checked. Usefulness 1-9 all yes. README has copy
`src/lib/`, import, props, three tool screenshots, and a github.com
player URL. Log marked SHIPPED. This product appended to the
multi-session React prompt's shipped list. No second product in this
repo. Do not SHIPPED until screenshots and video.
