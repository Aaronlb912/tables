import { useEffect, useState } from 'react'
import { cloneRow, isNotesColumn, isNumberColumn, normalizeRow, parseNumberCell } from './table-json.js'
import './table.css'

export function RowPage({ table, row, mode, onSave, onCancel, onRemove, onDuplicate }) {
  const isNew = mode === 'new'
  const first = table.columns[0]
  const [cells, setCells] = useState(() => {
    const next = {}
    table.columns.forEach((column) => {
      next[column.id] = row.cells?.[column.id] || ''
    })
    return next
  })
  const [miss, setMiss] = useState('')

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function builtRow() {
    if (!first) {
      setMiss('Add a column first.')
      return null
    }
    if (!String(cells[first.id] || '').trim()) {
      setMiss(`Need a ${first.name}.`)
      return null
    }
    for (let i = 0; i < table.columns.length; i += 1) {
      const column = table.columns[i]
      if (!isNumberColumn(column)) continue
      if (!parseNumberCell(cells[column.id]).ok) {
        setMiss(`${column.name} has to be a number.`)
        return null
      }
    }
    setMiss('')
    return normalizeRow({ ...row, cells }, table.columns, 0)
  }

  function save(event) {
    event.preventDefault()
    const next = builtRow()
    if (!next) return
    onSave(next)
  }

  function duplicate() {
    const next = builtRow()
    if (!next) return
    onDuplicate(cloneRow(next))
  }

  const heading = isNew
    ? 'New row'
    : String(cells[first?.id] || '').trim() || 'Untitled row'

  return (
    <div className="tb tb-page">
      <p className="tb-kicker">{isNew ? 'Add row' : 'Edit row'}</p>
      <h1>{heading}</h1>
      <p className="tb-note">{table.title}. Escape goes back without saving.</p>

      {miss ? <p className="tb-miss" role="alert">{miss}</p> : null}

      <form className="tb-form" onSubmit={save}>
        {table.columns.map((column) => (
          <label key={column.id} className="tb-field">
            <span>{column.name}{column.hidden ? ' (hidden)' : ''}</span>
            {isNotesColumn(column) ? (
              <textarea
                rows={5}
                value={cells[column.id] || ''}
                onChange={(event) => setCells({ ...cells, [column.id]: event.target.value })}
              />
            ) : (
              <input
                value={cells[column.id] || ''}
                inputMode={isNumberColumn(column) ? 'decimal' : undefined}
                onChange={(event) => setCells({ ...cells, [column.id]: event.target.value })}
              />
            )}
          </label>
        ))}

        <div className="tb-actions">
          <button type="submit">Save</button>
          <button type="button" className="tb-secondary" onClick={onCancel}>
            Cancel
          </button>
          {onDuplicate ? (
            <button type="button" className="tb-secondary" onClick={duplicate}>
              Duplicate
            </button>
          ) : null}
          {onRemove ? (
            <button type="button" className="tb-quiet" onClick={onRemove}>
              Remove
            </button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
