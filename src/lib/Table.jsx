import { useEffect, useRef, useState } from 'react'
import { RowPage } from './RowPage.jsx'
import {
  addColumn,
  blankRow,
  cloneRow,
  columnTotal,
  downloadCsv,
  downloadTable,
  hideColumn,
  isNumberColumn,
  isNotesColumn,
  moveById,
  normalizeTable,
  parseCsv,
  parseFile,
  parseNumberCell,
  readTextFile,
  removeColumn,
  renameColumn,
  rowMatches,
  rowToCsv,
  showColumn,
  sortRows,
  tableToCsv,
  visibleColumns,
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
  const moving = useRef(false)
  const [sizing, setSizing] = useState(null)

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
  const gridCols = visibleColumns(value.columns)
  const hiddenCols = value.columns.filter((column) => column.hidden)

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

  function neighbor(rowId, colId, key, shift) {
    const cols = gridCols
    const colIndex = cols.findIndex((item) => item.id === colId)
    const rowIndex = shown.findIndex((item) => item.id === rowId)
    if (colIndex < 0 || rowIndex < 0) return null
    if (key === 'Tab') {
      let nextCol = colIndex + (shift ? -1 : 1)
      let nextRow = rowIndex
      if (nextCol >= cols.length) {
        nextCol = 0
        nextRow += 1
      } else if (nextCol < 0) {
        nextCol = cols.length - 1
        nextRow -= 1
      }
      if (nextRow < 0 || nextRow >= shown.length) return null
      return { row: shown[nextRow], column: cols[nextCol] }
    }
    const nextRow = rowIndex + (shift ? -1 : 1)
    if (nextRow < 0 || nextRow >= shown.length) return null
    return { row: shown[nextRow], column: cols[colIndex] }
  }

  function saveCell(next) {
    if (!editing) return
    if (skipSave.current) {
      skipSave.current = false
      moving.current = false
      return
    }
    const column = value.columns.find((item) => item.id === editing.colId)
    if (column && isNumberColumn(column) && !parseNumberCell(draft).ok) {
      setMiss(`${column.name} has to be a number.`)
      moving.current = false
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
    if (next?.row && next?.column) {
      const row = rows.find((item) => item.id === next.row.id) || next.row
      startEdit(row, next.column)
      return
    }
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
    setUndo({ kind: 'row', row, index })
    undoTimer.current = setTimeout(() => setUndo(null), 12000)
  }

  function undoRemove() {
    if (!undo) return
    if (undoTimer.current) clearTimeout(undoTimer.current)
    if (undo.kind === 'column') {
      const columns = [...value.columns]
      columns.splice(Math.min(undo.index, columns.length), 0, undo.column)
      const rows = value.rows.map((row) => {
        const saved = undo.cells.find((item) => item.id === row.id)
        return {
          ...row,
          cells: {
            ...row.cells,
            [undo.column.id]: saved ? saved.value : '',
          },
        }
      })
      onChange({ ...value, columns, rows })
      setUndo(null)
      return
    }
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
    const index = value.columns.findIndex((item) => item.id === colId)
    const column = value.columns[index]
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
    if (undoTimer.current) clearTimeout(undoTimer.current)
    setUndo({
      kind: 'column',
      column,
      index,
      cells: value.rows.map((row) => ({ id: row.id, value: row.cells?.[colId] || '' })),
    })
    undoTimer.current = setTimeout(() => setUndo(null), 12000)
  }

  function hideCol(colId) {
    const result = hideColumn(value, colId)
    if (!result.ok) {
      setMiss(result.error)
      return
    }
    if (editing?.colId === colId) {
      skipSave.current = true
      setEditing(null)
      setDraft('')
    }
    if (colRename?.id === colId) setColRename(null)
    onChange(result.table)
    setMiss('')
  }

  function showCol(colId) {
    onChange(showColumn(value, colId))
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

  function widthOf(column) {
    if (sizing && sizing.id === column.id) return sizing.width
    return column.width
  }

  function startSize(event, column) {
    event.preventDefault()
    event.stopPropagation()
    skipSort.current = true
    const startX = event.clientX
    const startW = event.currentTarget.closest('th').getBoundingClientRect().width
    let width = Math.max(72, Math.round(startW))
    setSizing({ id: column.id, width })

    function onMove(moveEvent) {
      width = Math.max(72, Math.round(startW + moveEvent.clientX - startX))
      setSizing({ id: column.id, width })
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      onChange({
        ...value,
        columns: value.columns.map((item) => (item.id === column.id ? { ...item, width } : item)),
      })
      setSizing(null)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  async function copyCsv() {
    try {
      await navigator.clipboard.writeText(tableToCsv(value))
      setMiss('')
    } catch {
      setMiss('Could not copy. Download CSV instead.')
    }
  }

  async function copyRow(row) {
    try {
      await navigator.clipboard.writeText(rowToCsv(value, row))
      setMiss('')
    } catch {
      setMiss('Could not copy. Download CSV instead.')
    }
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
            Click a cell to change it. Tab moves across. Enter moves down.
            Open a row for the whole line. Drag a row or a column to change
            order. Drag a header edge to resize. Hide a column you do not
            need on the grid. Copy CSV. Paste a CSV or print this table.
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
          <button type="button" className="tb-secondary" onClick={copyCsv}>
            Copy CSV
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

      {hiddenCols.length ? (
        <div className="tb-hidden">
          <span>Hidden</span>
          {hiddenCols.map((column) => (
            <button key={column.id} type="button" className="tb-secondary" onClick={() => showCol(column.id)}>
              Show {column.name}
            </button>
          ))}
        </div>
      ) : null}

      {miss ? <p className="tb-miss" role="alert">{miss}</p> : null}
      {undo ? (
        <p className="tb-undo">
          {undo.kind === 'column' ? 'Column removed.' : 'Row removed.'}{' '}
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
          <table
            className="tb-grid"
            style={
              value.columns.some((column) => widthOf(column) && !column.hidden)
                ? {
                    tableLayout: 'fixed',
                    width: gridCols.reduce((sum, column) => sum + (widthOf(column) || 140), 88),
                  }
                : undefined
            }
          >
            <thead>
              <tr>
                {gridCols.map((column, colIndex) => {
                  const active = sort?.colId === column.id
                  const label = active ? `${column.name} ${sort.dir === 'desc' ? '↓' : '↑'}` : column.name
                  const renamingCol = colRename?.id === column.id
                  const colWidth = widthOf(column)
                  return (
                    <th
                      key={column.id}
                      scope="col"
                      draggable={!renamingCol && !sizing}
                      className={[
                        overCol === column.id ? 'tb-drop-col' : '',
                        colIndex === 0 ? 'tb-sticky-col' : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined}
                      style={colWidth ? { width: colWidth, minWidth: colWidth } : undefined}
                      onDragStart={(event) => {
                        if (sizing) {
                          event.preventDefault()
                          return
                        }
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
                          <button type="button" className="tb-quiet" onClick={() => hideCol(column.id)}>
                            Hide
                          </button>
                          <button type="button" className="tb-quiet" onClick={() => dropColumn(column.id)}>
                            Remove
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        className="tb-resize"
                        aria-label={`Resize ${column.name}`}
                        draggable={false}
                        onMouseDown={(event) => startSize(event, column)}
                      />
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
                  <td colSpan={gridCols.length + 1}>
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
                  {gridCols.map((column, colIndex) => {
                    const active = editing && editing.rowId === row.id && editing.colId === column.id
                    const numberCol = isNumberColumn(column)
                    const notesCol = isNotesColumn(column)
                    const colWidth = widthOf(column)
                    return (
                      <td
                        key={column.id}
                        className={[
                          numberCol ? 'tb-num' : '',
                          notesCol ? 'tb-notes' : '',
                          colIndex === 0 ? 'tb-sticky-col' : '',
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined}
                        style={colWidth ? { width: colWidth, minWidth: colWidth } : undefined}
                      >
                        {active ? (
                          <input
                            ref={cellInput}
                            className="tb-cell-input"
                            value={draft}
                            inputMode={numberCol ? 'decimal' : undefined}
                            aria-label={`${column.name} for this row`}
                            draggable={false}
                            onChange={(event) => setDraft(event.target.value)}
                            onBlur={() => {
                              if (moving.current) {
                                moving.current = false
                                return
                              }
                              saveCell()
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Tab') {
                                event.preventDefault()
                                moving.current = true
                                saveCell(neighbor(row.id, column.id, 'Tab', event.shiftKey))
                                return
                              }
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                moving.current = true
                                saveCell(neighbor(row.id, column.id, 'Enter', event.shiftKey))
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
                    <button type="button" className="tb-quiet" onClick={() => copyRow(row)}>
                      Copy
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
            {value.rows.length > 0 && gridCols.some(isNumberColumn) ? (
              <tfoot>
                <tr>
                  {gridCols.map((column, index) => (
                    <td
                      key={column.id}
                      className={[
                        isNumberColumn(column) ? 'tb-total tb-num' : '',
                        index === 0 ? 'tb-sticky-col' : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined}
                    >
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
