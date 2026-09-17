import { useState } from 'react'
import { Workspace, normalizeWorkspace, sampleWorkspace } from './lib/index.js'

const STORAGE_KEY = 'tables-workspace'
const OLD_KEY = 'tables-sheet'

function labelSample(workspace) {
  return {
    ...workspace,
    tables: workspace.tables.map((table) =>
      table.id === 'table-willow' && table.title === 'Willow Court Nursery'
        ? { ...table, title: 'DEMO TABLE Willow Court Nursery' }
        : table,
    ),
  }
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return normalizeWorkspace(JSON.parse(raw))
    const old = localStorage.getItem(OLD_KEY)
    if (old) return normalizeWorkspace(JSON.parse(old))
    return labelSample(normalizeWorkspace(sampleWorkspace))
  } catch {
    return labelSample(normalizeWorkspace(sampleWorkspace))
  }
}

function writeStored(workspace) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
  } catch {
    // Demo still runs if storage is blocked.
  }
}

export default function App() {
  const [workspace, setWorkspace] = useState(readStored)

  function change(next) {
    const normalized = normalizeWorkspace(next)
    setWorkspace(normalized)
    writeStored(normalized)
  }

  return <Workspace value={workspace} onChange={change} />
}
