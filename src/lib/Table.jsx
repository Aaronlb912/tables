import { useEffect, useRef, useState } from 'react'
import { RowPage } from './RowPage.jsx'
import {
  addColumn,
  blankRow,
  cloneRow,
  columnTotal,
  downloadCsv,
  downloadTable,
  isNumberColumn,
  moveById,
  normalizeTable,
  parseCsv,
  parseFile,
  parseNumberCell,
  readTextFile,
  removeColumn,
  renameColumn,
  rowMatches,
  sortRows,
} from './table-json.js'
import './table.css'

export function Table({ value, onChange, onTables, onLoadWorkspace }) {
  const titleInput = useRef(null)
  const cellInput = useRef(null)
  const jsonInput = useRef(null)
  const csvInput = useRef(null)
  const undoTimer = useRef(null)
  const [tableTitle, setTableTitle] = useState(value.title)
  const [renaming, setRenaming] = useState(false)
  const [miss, setMiss] = useState('')
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState(null)
  const [undo, setUndo] = useState(null)
  const [colRename, setColRename] = useState(null)
  const skipSave = useRef(false)
  const skipCol = useRef(false)
  const colInput = useRef(null)
  const [page, setPage] = useState(null)
  const [dragRow, setDragRow] = useState(null)
  const [overRow, setOverRow] = useState(null)
  const [dragCol, setDragCol] = useState(null)
  const [overCol, setOverCol] = useState(null)
  const skipSort = useRef(false)

  useEffect(() => {
    setTableTitle(value.title)
  }, [value.title])

  useEffect(() => {
    if (renaming && titleInput.current) titleInput.current.focus()
  }, [renaming])

  useEffect(() => {
    if (editing && cellInput.current) {
      cellInput.current.focus()
      cellInput.current.select()
    }
  }, [editing])

  useEffect(() => {
    if (colRename && colInput.current) {
      colInput.current.focus()
      colInput.current.select()
    }
  }, [colRename])

  useEffect(() => {
    function onKey(event) {
      if (event.key !== 'Escape') return
      if (editing) {
        skipSave.current = true
        setEditing(null)
        setDraft('')
        return
      }
      if (colRename) {
        skipCol.current = true
        setColRename(null)
        return
      }
      if (renaming) {
        setTableTitle(value.title)
        setRenaming(false)
        setMiss('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, renaming, colRename, value.title])

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current)
    }
  }, [])

  useEffect(() => {
    function onPaste(event) {
      if (page) return
      const target = event.target
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }
      const text = event.clipboardData?.getData('text/plain') || ''
      if (!text.trim()) return
      try {
        const next = parseCsv(text)
        event.preventDefault()
        onChange({
          ...next,
          id: value.id,
          title: value.title || next.title,
        })
        setMiss('')
        setQuery('')
        setSort(null)
      } catch (error) {
        setMiss(error.message || 'Could not paste that CSV.')
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [onChange, page, value.id, value.title])

  const filtering = Boolean(query.trim())
  const matched = filtering
    ? value.rows.filter((row) => rowMatches(row, query, value.columns))
    : value.rows
  const shown = sortRows(matched, value.columns, sort)

  if (page) {
    return (
      <RowPage
        table={value}
        row={page.row}
        mode={page.mode}
        onSave={savePageRow}
        onCancel={() => setPage(null)}
        onDuplicate={page.mode === 'edit' ? duplicatePageRow : undefined}
        onRemove={
          page.mode === 'edit'
            ? () => {
                removeRow(page.row.id)
                setPage(null)
              }
            : undefined
        }
      />
    )
  }

  function commitTitle() {
    const next = tableTitle.trim()
    if (!next) {
      setMiss('Need a table title.')
      setTableTitle(value.title)
      setRenaming(false)
      return
    }
    setMiss('')
    setRenaming(false)
    if (next !== value.title) onChange({ ...value, title: next })
  }

  function startEdit(row, column) {
    setEditing({ rowId: row.id, colId: column.id })
    setDraft(row.cells[column.id] || '')
    setMiss('')
  }

  function saveCell() {
    if (!editing) return
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    const column = value.columns.find((item) => item.id === editing.colId)
    if (column && isNumberColumn(column) && !parseNumberCell(draft).ok) {
      setMiss(`${column.name} has to be a number.`)
      return
    }
    setMiss('')
    const rows = value.rows.map((row) => {
      if (row.id !== editing.rowId) return row
      return {
        ...row,
        cells: {
          ...row.cells,
          [editing.colId]: draft,
        },
      }
    })
    onChange({ ...value, rows })
    setEditing(null)
    setDraft('')
  }

  function addRow() {
    if (!value.columns.length) {
      setMiss('Add a column first.')
      return
    }
    setMiss('')
    setEditing(null)
    setPage({ mode: 'new', row: blankRow(value.columns) })
  }

  function openRow(row) {
    setEditing(null)
    setMiss('')
    setPage({ mode: 'edit', row })
  }

  function savePageRow(next) {
    if (page?.mode === 'new') {
      onChange({ ...value, rows: [...value.rows, next] })
    } else {
      onChange({
        ...value,
        rows: value.rows.map((row) => (row.id === next.id ? next : row)),
      })
    }
    setPage(null)
  }

  function duplicatePageRow(copy) {
    const index = value.rows.findIndex((row) => row.id === page.row.id)
    const rows = [...value.rows]
    const at = index < 0 ? rows.length : index + 1
    rows.splice(at, 0, copy)
    onChange({ ...value, rows })
    setPage({ mode: 'edit', row: copy })
  }

  function duplicateRow(id) {
    const row = value.rows.find((item) => item.id === id)
    if (!row) return
    const copy = cloneRow(row)
    const index = value.rows.findIndex((item) => item.id === id)
    const rows = [...value.rows]
    rows.splice(index + 1, 0, copy)
    onChange({ ...value, rows })
    setMiss('')
  }

  function removeRow(id) {
    const index = value.rows.findIndex((row) => row.id === id)
    if (index < 0) return
    const row = value.rows[index]
    if (editing?.rowId === id) {
      setEditing(null)
      setDraft('')
    }
    onChange({
      ...value,
      rows: value.rows.filter((item) => item.id !== id),
    })
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndo({ row, index })
    undoTimer.current = setTimeout(() => setUndo(null), 12000)
  }

  function undoRemove() {
    if (!undo) return
    if (undoTimer.current) clearTimeout(undoTimer.current)
    const rows = [...value.rows]
    const at = Math.min(undo.index, rows.length)
    rows.splice(at, 0, undo.row)
    onChange({ ...value, rows })
    setUndo(null)
  }

  function addCol() {
    const next = addColumn(value)
    const column = next.columns[next.columns.length - 1]
    onChange(next)
    setMiss('')
    setColRename({ id: column.id, draft: column.name })
  }

  function commitColumn() {
    if (!colRename) return
    if (skipCol.current) {
      skipCol.current = false
      return
    }
    const name = colRename.draft.trim()
    if (!name) {
      setMiss('Need a column name.')
      setColRename(null)
      return
    }
    onChange(renameColumn(value, colRename.id, name))
    setColRename(null)
    setMiss('')
  }

  function dropColumn(colId) {
    const result = removeColumn(value, colId)
    if (!result.ok) {
      setMiss(result.error)
      return
    }
    if (editing?.colId === colId) {
      skipSave.current = true
      setEditing(null)
      setDraft('')
    }
    if (sort?.colId === colId) setSort(null)
    if (colRename?.id === colId) setColRename(null)
    onChange(result.table)
    setMiss('')
  }

  function toggleSort(colId) {
    if (skipSort.current) {
      skipSort.current = false
      return
    }
    setSort((current) => {
      if (!current || current.colId !== colId) return { colId, dir: 'asc' }
      if (current.dir === 'asc') return { colId, dir: 'desc' }
      return null
    })
  }

  async function loadJson(file) {
    if (!file) return
    try {
      const text = await readTextFile(file)
      const parsed = parseFile(text)
      if (parsed.kind === 'workspace') {
        if (onLoadWorkspace) onLoadWorkspace(parsed.value)
        else onChange(parsed.value.tables[0] || normalizeTable({}))
      } else {
        onChange(parsed.value)
      }
      setMiss('')
      setUndo(null)
    } catch (error) {
      setMiss(error.message || 'Could not load that file.')
    }
  }

  async function loadCsv(file) {
    if (!file) return
    try {
      const text = await readTextFile(file)
      const next = parseCsv(text)
      onChange({
        ...next,
        id: value.id,
        title: value.title || next.title,
      })
      setMiss('')
      setUndo(null)
      setQuery('')
      setSort(null)
    } catch (error) {
      setMiss(error.message || 'Could not load that CSV.')
    }
  }

  async function pasteCsv() {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.trim()) {
        setMiss('Clipboard is empty.')
        return
      }
      const next = parseCsv(text)
      onChange({
        ...next,
        id: value.id,
        title: value.title || next.title,
      })
      setMiss('')
      setUndo(null)
      setQuery('')
      setSort(null)
    } catch (error) {
      setMiss(error.message || 'Could not paste that CSV.')
    }
  }

  function printTable() {
    window.print()
  }

  function dropRowOn(overId) {
    const fromId = dragRow
    setDragRow(null)
    setOverRow(null)
    if (!fromId || fromId === overId) return
    onChange({ ...value, rows: moveById(value.rows, fromId, overId) })
    setSort(null)
    setMiss('')
  }

  function dropColOn(overId) {
    const fromId = dragCol
    skipSort.current = true
    setDragCol(null)
    setOverCol(null)
    if (!fromId || fromId === overId) return
    onChange({ ...value, columns: moveById(value.columns, fromId, overId) })
    setMiss('')
  }

  return (
    <div className="tb">
      <header className="tb-top">
        <div>
          <p className="tb-kicker">Table</p>
          {renaming ? (
            <form
              className="tb-title-form"
              onSubmit={(event) => {
                event.preventDefault()
                commitTitle()
              }}
            >
              <input
                ref={titleInput}
                value={tableTitle}
                onChange={(event) => setTableTitle(event.target.value)}
                onBlur={commitTitle}
                aria-label="Table title"
              />
            </form>
          ) : (
            <div className="tb-title-row">
              <h1>{value.title || 'Untitled table'}</h1>
              <button type="button" className="tb-quiet" onClick={() => setRenaming(true)}>
                Edit
              </button>
            </div>
          )}
          <p className="tb-note">
            Click a cell to change it. Open a row for the whole line. Drag a row or a
            column to change order. Paste a CSV or print this table.
          </p>
        </div>
        <div className="tb-actions">
          {onTables ? (
            <button type="button" className="tb-secondary" onClick={onTables}>
              All tables
            </button>
          ) : null}
          <button type="button" onClick={addRow}>
            Add row
          </button>
          <button type="button" className="tb-secondary" onClick={addCol}>
            Add column
          </button>
          <button type="button" className="tb-secondary" onClick={() => downloadTable(value)}>
            Download JSON
          </button>
          <button type="button" className="tb-secondary" onClick={() => downloadCsv(value)}>
            Download CSV
          </button>
          <button type="button" className="tb-secondary" onClick={() => jsonInput.current?.click()}>
            Load JSON
          </button>
          <button type="button" className="tb-secondary" onClick={() => csvInput.current?.click()}>
            Load CSV
          </button>
          <button type="button" className="tb-secondary" onClick={pasteCsv}>
            Paste CSV
          </button>
          <button type="button" className="tb-secondary" onClick={printTable}>
            Print
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

      <div className="tb-toolbar">
        <label className="tb-search">
          <span>Find</span>
          <input
            type="search"
            value={query}
            placeholder="Plant, SKU, notes"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        {filtering ? (
          <p className="tb-hint">
            {shown.length} of {value.rows.length} {value.rows.length === 1 ? 'row' : 'rows'}
          </p>
        ) : (
          <p className="tb-hint">
            {value.rows.length} {value.rows.length === 1 ? 'row' : 'rows'}
          </p>
        )}
      </div>

      {miss ? <p className="tb-miss" role="alert">{miss}</p> : null}
      {undo ? (
        <p className="tb-undo">
          Row removed.{' '}
          <button type="button" className="tb-quiet" onClick={undoRemove}>
            Put it back
          </button>
        </p>
      ) : null}

      {value.rows.length > 0 && shown.length === 0 ? (
        <div className="tb-empty">
          <p>Nothing matches that search.</p>
          <button type="button" className="tb-secondary" onClick={() => setQuery('')}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="tb-scroll">
          <table className="tb-grid">
            <thead>
              <tr>
                {value.columns.map((column) => {
                  const active = sort?.colId === column.id
                  const label = active ? `${column.name} ${sort.dir === 'desc' ? '↓' : '↑'}` : column.name
                  const renamingCol = colRename?.id === column.id
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      draggable={!renamingCol}
                      className={overCol === column.id ? 'tb-drop-col' : undefined}
                      onDragStart={(event) => {
                        setDragCol(column.id)
                        skipSort.current = true
                        event.dataTransfer.effectAllowed = 'move'
                        event.dataTransfer.setData('text/plain', column.id)
                      }}
                      onDragOver={(event) => {
                        event.preventDefault()
                        if (dragCol && dragCol !== column.id) setOverCol(column.id)
                      }}
                      onDrop={(event) => {
                        event.preventDefault()
                        dropColOn(column.id)
                      }}
                      onDragEnd={() => {
                        setDragCol(null)
                        setOverCol(null)
                      }}
                    >
                      {renamingCol ? (
                        <input
                          ref={colInput}
                          className="tb-col-input"
                          value={colRename.draft}
                          aria-label="Column name"
                          onChange={(event) => setColRename({ ...colRename, draft: event.target.value })}
                          onBlur={commitColumn}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault()
                              commitColumn()
                            }
                          }}
                        />
                      ) : (
                        <div className="tb-col">
                          <button type="button" className="tb-sort" onClick={() => toggleSort(column.id)}>
                            {label}
                          </button>
                          <button
                            type="button"
                            className="tb-quiet"
                            onClick={() => setColRename({ id: column.id, draft: column.name })}
                          >
                            Edit
                          </button>
                          <button type="button" className="tb-quiet" onClick={() => dropColumn(column.id)}>
                            Remove
                          </button>
                        </div>
                      )}
                    </th>
                  )
                })}
                <th className="tb-row-actions" scope="col">
                  <span className="tb-visually-hidden">Row</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {value.rows.length === 0 ? (
                <tr>
                  <td colSpan={value.columns.length + 1}>
                    <div className="tb-empty tb-empty-cell">
                      <p>No rows yet. Add a row, or load a CSV or JSON file.</p>
                      <button type="button" onClick={addRow}>
                        Add row
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                shown.map((row) => (
                <tr
                  key={row.id}
                  draggable={!editing}
                  className={overRow === row.id ? 'tb-drop-row' : undefined}
                  onDragStart={(event) => {
                    if (editing) {
                      event.preventDefault()
                      return
                    }
                    setDragRow(row.id)
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', row.id)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    if (dragRow && dragRow !== row.id) setOverRow(row.id)
                  }}
                  onDrop={(event) => {
                    event.preventDefault()
                    dropRowOn(row.id)
                  }}
                  onDragEnd={() => {
                    setDragRow(null)
                    setOverRow(null)
                  }}
                >
                  {value.columns.map((column) => {
                    const active = editing && editing.rowId === row.id && editing.colId === column.id
                    const numberCol = isNumberColumn(column)
                    return (
                      <td key={column.id} className={numberCol ? 'tb-num' : undefined}>
                        {active ? (
                          <input
                            ref={cellInput}
                            className="tb-cell-input"
                            value={draft}
                            inputMode={numberCol ? 'decimal' : undefined}
                            aria-label={`${column.name} for this row`}
                            draggable={false}
                            onChange={(event) => setDraft(event.target.value)}
                            onBlur={saveCell}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                saveCell()
                              }
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            className="tb-cell"
                            onClick={() => startEdit(row, column)}
                          >
                            {row.cells[column.id] || <span className="tb-blank">Empty</span>}
                          </button>
                        )}
                      </td>
                    )
                  })}
                  <td className="tb-row-actions">
                    <button type="button" className="tb-quiet" onClick={() => openRow(row)}>
                      Open
                    </button>
                    <button type="button" className="tb-quiet" onClick={() => duplicateRow(row.id)}>
                      Duplicate
                    </button>
                    <button type="button" className="tb-quiet" onClick={() => removeRow(row.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
            {value.rows.length > 0 && value.columns.some(isNumberColumn) ? (
              <tfoot>
                <tr>
                  {value.columns.map((column, index) => (
                    <td key={column.id} className={isNumberColumn(column) ? 'tb-total tb-num' : undefined}>
                      {isNumberColumn(column) ? columnTotal(shown, column) : index === 0 ? 'Total' : ''}
                    </td>
                  ))}
                  <td className="tb-row-actions" />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      )}
    </div>
  )
}
