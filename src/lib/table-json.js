function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function newTableId() {
  return uid('table')
}

export function newColumnId() {
  return uid('col')
}

export function newRowId() {
  return uid('row')
}

export function normalizeColumn(column, index) {
  const raw = column && typeof column === 'object' ? column : {}
  return {
    id: String(raw.id || `col-${index + 1}`),
    name: String(raw.name || raw.label || `Column ${index + 1}`),
  }
}

export function normalizeRow(row, columns, index) {
  const raw = row && typeof row === 'object' ? row : {}
  const source = raw.cells && typeof raw.cells === 'object' ? raw.cells : raw
  const cells = {}
  columns.forEach((column) => {
    const value = source[column.id]
    cells[column.id] = value == null ? '' : String(value)
  })
  return {
    id: String(raw.id || `row-${index + 1}`),
    cells,
  }
}

export function normalizeTable(table) {
  const raw = table && typeof table === 'object' ? table : {}
  const columns = Array.isArray(raw.columns) && raw.columns.length
    ? raw.columns.map(normalizeColumn)
    : [
        { id: 'col-1', name: 'Name' },
        { id: 'col-2', name: 'Qty' },
        { id: 'col-3', name: 'Notes' },
      ]
  const rows = Array.isArray(raw.rows) ? raw.rows.map((row, index) => normalizeRow(row, columns, index)) : []
  return {
    id: String(raw.id || newTableId()),
    title: raw.title == null ? 'Untitled table' : String(raw.title),
    columns,
    rows,
  }
}

export function normalizeWorkspace(data) {
  const raw = data && typeof data === 'object' ? data : {}
  if (Array.isArray(raw.tables) || raw.kind === 'tables') {
    const tables = Array.isArray(raw.tables) && raw.tables.length
      ? raw.tables.map((table) => normalizeTable(table))
      : [blankTable()]
    return {
      title: String(raw.title || '').trim() || 'Tables',
      tables,
    }
  }
  if (Array.isArray(raw.columns) || Array.isArray(raw.rows)) {
    return {
      title: 'Tables',
      tables: [normalizeTable(raw)],
    }
  }
  return {
    title: 'Tables',
    tables: [blankTable()],
  }
}

export function blankTable() {
  return normalizeTable({
    id: newTableId(),
    title: 'Untitled table',
    columns: [
      { id: 'col-1', name: 'Name' },
      { id: 'col-2', name: 'Qty' },
      { id: 'col-3', name: 'Notes' },
    ],
    rows: [],
  })
}

export function blankRow(columns) {
  const cells = {}
  columns.forEach((column) => {
    cells[column.id] = ''
  })
  return {
    id: newRowId(),
    cells,
  }
}

export function cloneRow(row) {
  return {
    id: newRowId(),
    cells: { ...row.cells },
  }
}

export function cloneTable(table) {
  const next = normalizeTable(table)
  return {
    ...next,
    id: newTableId(),
    title: `${next.title} copy`,
    columns: next.columns.map((column) => ({ ...column })),
    rows: next.rows.map((row) => cloneRow(row)),
  }
}

export function addColumn(table, name = 'New column') {
  const column = { id: newColumnId(), name }
  const columns = [...table.columns, column]
  const rows = table.rows.map((row) => ({
    ...row,
    cells: { ...row.cells, [column.id]: '' },
  }))
  return { ...table, columns, rows }
}

export function renameColumn(table, colId, name) {
  return {
    ...table,
    columns: table.columns.map((column) => (column.id === colId ? { ...column, name } : column)),
  }
}

export function removeColumn(table, colId) {
  if (table.columns.length < 2) return { ok: false, error: 'Keep at least one column.' }
  const columns = table.columns.filter((column) => column.id !== colId)
  const rows = table.rows.map((row) => {
    const cells = { ...row.cells }
    delete cells[colId]
    return { ...row, cells }
  })
  return { ok: true, table: { ...table, columns, rows } }
}

export function rowMatches(row, query, columns) {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return true
  return columns.some((column) => String(row.cells?.[column.id] || '').toLowerCase().includes(needle))
}

export function isNumberColumn(column) {
  const name = String(column.name || column.id || '').toLowerCase().trim()
  return name === 'qty' || name === 'count' || name === 'amount' || name === 'quantity'
}

export function parseNumberCell(text) {
  const raw = String(text || '').trim()
  if (raw === '') return { ok: true, value: null }
  const n = Number(raw.replace(/,/g, ''))
  if (Number.isNaN(n)) return { ok: false }
  return { ok: true, value: n }
}

export function columnTotal(rows, column) {
  let sum = 0
  let any = false
  rows.forEach((row) => {
    const parsed = parseNumberCell(row.cells?.[column.id])
    if (parsed.ok && parsed.value != null) {
      sum += parsed.value
      any = true
    }
  })
  if (!any) return ''
  return Number.isInteger(sum) ? String(sum) : String(Math.round(sum * 100) / 100)
}

export function moveById(list, fromId, overId) {
  if (!fromId || !overId || fromId === overId) return list
  const from = list.findIndex((item) => item.id === fromId)
  if (from < 0) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  const over = next.findIndex((entry) => entry.id === overId)
  if (over < 0) {
    next.push(item)
    return next
  }
  next.splice(over, 0, item)
  return next
}

export function sortRows(rows, columns, sort) {
  if (!sort?.colId) return rows
  const column = columns.find((item) => item.id === sort.colId)
  if (!column) return rows
  const dir = sort.dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const left = String(a.cells[column.id] || '')
    const right = String(b.cells[column.id] || '')
    const leftNum = Number(left)
    const rightNum = Number(right)
    if (left !== '' && right !== '' && !Number.isNaN(leftNum) && !Number.isNaN(rightNum)) {
      return (leftNum - rightNum) * dir
    }
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }) * dir
  })
}

function download(filename, text, type) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function fileName(title, suffix) {
  const slug = String(title || 'table')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'table'
  return `${slug}${suffix}`
}

export function downloadTable(table) {
  download(fileName(table.title, '.json'), `${JSON.stringify(normalizeTable(table), null, 2)}\n`, 'application/json')
}

export function downloadWorkspace(workspace) {
  download(
    fileName(workspace.title || 'tables', '-all.json'),
    `${JSON.stringify(normalizeWorkspace(workspace), null, 2)}\n`,
    'application/json',
  )
}

function csvEscape(value) {
  const text = String(value ?? '')
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function tableToCsv(table) {
  const next = normalizeTable(table)
  const header = next.columns.map((column) => csvEscape(column.name)).join(',')
  const lines = next.rows.map((row) => next.columns.map((column) => csvEscape(row.cells[column.id])).join(','))
  return `${[header, ...lines].join('\r\n')}\r\n`
}

export function downloadCsv(table) {
  download(fileName(table.title, '.csv'), tableToCsv(table), 'text/csv')
}

function splitCsvLine(line) {
  const cells = []
  let current = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i += 1
        } else {
          quoted = false
        }
      } else {
        current += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      cells.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  cells.push(current)
  return cells
}

export function parseCsv(text) {
  const raw = String(text || '').replace(/^\uFEFF/, '')
  const lines = raw.split(/\r\n|\n|\r/).filter((line) => line.length)
  if (!lines.length) throw new Error('That CSV is empty.')
  const headers = splitCsvLine(lines[0]).map((name) => name.trim())
  if (!headers.some(Boolean)) throw new Error('That CSV has no column names.')
  const columns = headers.map((name, index) => ({
    id: name ? `col-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || index + 1}` : `col-${index + 1}`,
    name: name || `Column ${index + 1}`,
  }))
  const seen = new Set()
  columns.forEach((column, index) => {
    let id = column.id
    let n = 2
    while (seen.has(id)) {
      id = `${column.id}-${n}`
      n += 1
    }
    seen.add(id)
    columns[index] = { ...column, id }
  })
  const rows = lines.slice(1).map((line, index) => {
    const values = splitCsvLine(line)
    const cells = {}
    columns.forEach((column, colIndex) => {
      cells[column.id] = values[colIndex] == null ? '' : String(values[colIndex])
    })
    return { id: `row-${index + 1}`, cells }
  })
  return normalizeTable({
    id: newTableId(),
    title: 'Imported CSV',
    columns,
    rows,
  })
}

export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.readAsText(file)
  })
}

export function parseFile(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('That file is not JSON.')
  }
  if (Array.isArray(data)) {
    throw new Error('Need a table object, not a list.')
  }
  const raw = data && typeof data === 'object' ? data : {}
  if (Array.isArray(raw.tables) || raw.kind === 'tables') {
    return { kind: 'workspace', value: normalizeWorkspace(raw) }
  }
  if (Array.isArray(raw.columns) || Array.isArray(raw.rows) || raw.title) {
    return { kind: 'table', value: normalizeTable(raw) }
  }
  throw new Error('That JSON is not a table.')
}
