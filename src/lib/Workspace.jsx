import { useRef, useState } from 'react'
import { Table } from './Table.jsx'
import { sampleTable } from './sample-table.js'
import {
  blankTable,
  cloneTable,
  downloadWorkspace,
  normalizeTable,
  parseCsv,
  parseFile,
  readTextFile,
} from './table-json.js'
import './table.css'

export function Workspace({ value, onChange }) {
  const jsonInput = useRef(null)
  const csvInput = useRef(null)
  const [openId, setOpenId] = useState('')
  const [miss, setMiss] = useState('')
  const open = value.tables.find((table) => table.id === openId) || null

  function setTables(tables, nextOpen) {
    onChange({ ...value, tables })
    if (nextOpen) setOpenId(nextOpen)
  }

  function changeTable(next) {
    setTables(value.tables.map((table) => (table.id === next.id ? next : table)))
  }

  function addBlank() {
    const table = blankTable()
    setMiss('')
    setTables([...value.tables, table], table.id)
  }

  function useSample() {
    const table = normalizeTable(sampleTable)
    const exists = value.tables.some((item) => item.id === table.id)
    const tables = exists
      ? value.tables.map((item) => (item.id === table.id ? table : item))
      : [...value.tables, table]
    setMiss('')
    setTables(tables, table.id)
  }

  function duplicateTable(id) {
    const table = value.tables.find((item) => item.id === id)
    if (!table) return
    const copy = cloneTable(table)
    setMiss('')
    setTables([...value.tables, copy], copy.id)
  }

  function removeTable(id) {
    if (value.tables.length < 2) {
      setMiss('Keep at least one table.')
      return
    }
    const tables = value.tables.filter((table) => table.id !== id)
    setMiss('')
    setTables(tables, '')
  }

  async function loadJson(file) {
    if (!file) return
    try {
      const text = await readTextFile(file)
      const parsed = parseFile(text)
      if (parsed.kind === 'workspace') {
        onChange(parsed.value)
        setOpenId('')
      } else {
        const table = parsed.value
        const exists = value.tables.some((item) => item.id === table.id)
        const tables = exists
          ? value.tables.map((item) => (item.id === table.id ? table : item))
          : [...value.tables, table]
        onChange({ ...value, tables })
        setOpenId(table.id)
      }
      setMiss('')
    } catch (error) {
      setMiss(error.message || 'Could not load that file.')
    }
  }

  async function loadCsv(file) {
    if (!file) return
    try {
      const text = await readTextFile(file)
      const table = parseCsv(text)
      setMiss('')
      setTables([...value.tables, table], table.id)
    } catch (error) {
      setMiss(error.message || 'Could not load that CSV.')
    }
  }

  if (open) {
    return (
      <Table
        value={open}
        onChange={changeTable}
        onTables={() => setOpenId('')}
        onLoadWorkspace={(workspace) => {
          onChange(workspace)
          setOpenId(workspace.tables[0]?.id || '')
        }}
      />
    )
  }

  return (
    <div className="tb">
      <header className="tb-top">
        <div>
          <p className="tb-kicker">Tables</p>
          <h1>{value.title}</h1>
          <p className="tb-note">
            Open a table. Make a blank one. The sample is Willow Court Nursery.
            Names are fake.
          </p>
        </div>
        <div className="tb-actions">
          <button type="button" onClick={addBlank}>
            New table
          </button>
          <button type="button" className="tb-secondary" onClick={useSample}>
            Reset sample
          </button>
          <button type="button" className="tb-secondary" onClick={() => downloadWorkspace(value)}>
            Download all
          </button>
          <button type="button" className="tb-secondary" onClick={() => jsonInput.current?.click()}>
            Load JSON
          </button>
          <button type="button" className="tb-secondary" onClick={() => csvInput.current?.click()}>
            Load CSV
          </button>
          <input
            ref={jsonInput}
            className="tb-file"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              loadJson(event.target.files && event.target.files[0])
              event.target.value = ''
            }}
          />
          <input
            ref={csvInput}
            className="tb-file"
            type="file"
            accept="text/csv,.csv"
            onChange={(event) => {
              loadCsv(event.target.files && event.target.files[0])
              event.target.value = ''
            }}
          />
        </div>
      </header>

      {miss ? <p className="tb-miss" role="alert">{miss}</p> : null}

      {value.tables.length === 0 ? (
        <div className="tb-empty">
          <p>No tables yet.</p>
          <p>Make a blank table, or reset the nursery sample.</p>
          <button type="button" onClick={addBlank}>
            New table
          </button>
        </div>
      ) : (
        <ul className="tb-list">
          {value.tables.map((table) => (
            <li key={table.id} className="tb-card">
              <button type="button" className="tb-card-open" onClick={() => setOpenId(table.id)}>
                <strong>{table.title}</strong>
                <span>
                  {table.rows.length} {table.rows.length === 1 ? 'row' : 'rows'} · {table.columns.length}{' '}
                  columns
                </span>
              </button>
              <div className="tb-card-actions">
                <button type="button" className="tb-quiet" onClick={() => duplicateTable(table.id)}>
                  Duplicate
                </button>
                <button type="button" className="tb-quiet" onClick={() => removeTable(table.id)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
