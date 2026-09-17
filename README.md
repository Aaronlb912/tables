# Tables

Editable tables for a count you already keep. Click a cell. Add a
row. Keep more than one table. Search. Sort. Load and download JSON
or CSV. Drop `src/lib/` into a React app you already have.

The demo starts on the table list. DEMO TABLE Willow Court Nursery
is the sample. Names are fake. Open it, or make a blank table.

## Who it is for

A shop or crew that already runs React and needs a table of rows on
a page. Put your columns and counts in. Save the JSON or CSV.

## What you get

Copy `src/lib/`. That folder is the component.

- `Workspace.jsx` - table list plus the open table
- `Table.jsx` - one table
- `RowPage.jsx` - add row and edit row
- `table.css` - the look
- `table-json.js` - download, load parse, CSV, blank template
- `sample-table.js` - Willow Court Nursery sample
- `index.js` - the import

No account. Nothing sends mail. A new table starts empty with Name,
Qty, and Notes. You cannot remove the last table. The demo keeps
tables after a refresh (Reset sample on the list if you want Willow
Court back). Click a cell to type. Add row opens a page. Open a row
to edit the whole line. Notes is a longer box. Escape cancels. Click a column
name to sort. Add column. Quiet Edit and Remove on a column. Quiet
Open, Duplicate, and Remove on a row.

## Run the demo

```
npm install
npm start
```

Open http://127.0.0.1:48721/

## Use it in your own React app

1. Copy the `src/lib/` folder into your project (for example
   `src/lib/`).
2. Import the workspace (several tables) or the table (one table).

Several tables:

```jsx
import { useState } from 'react'
import { Workspace, sampleWorkspace } from './lib/index.js'

export function Stock() {
  const [workspace, setWorkspace] = useState(sampleWorkspace)
  return <Workspace value={workspace} onChange={setWorkspace} />
}
```

One table:

```jsx
import { useState } from 'react'
import { Table, sampleTable } from './lib/index.js'

export function Stock() {
  const [table, setTable] = useState(sampleTable)
  return <Table value={table} onChange={setTable} />
}
```

Change the title and the rows. Edit `src/lib/table.css` if you want
a different look.
