export const sampleTable = {
  id: 'table-willow',
  title: 'Willow Court Nursery',
  columns: [
    { id: 'sku', name: 'SKU' },
    { id: 'plant', name: 'Plant' },
    { id: 'size', name: 'Size' },
    { id: 'qty', name: 'Qty' },
    { id: 'unit', name: 'Unit' },
    { id: 'notes', name: 'Notes' },
  ],
  rows: [
    {
      id: 'row-boxwood',
      cells: {
        sku: 'WC-104',
        plant: 'Boxwood',
        size: '3 gal',
        qty: '12',
        unit: 'pot',
        notes: 'Trim Friday',
      },
    },
    {
      id: 'row-susan',
      cells: {
        sku: 'WC-221',
        plant: 'Black-eyed Susan',
        size: '1 gal',
        qty: '24',
        unit: 'pot',
        notes: 'Full sun bed',
      },
    },
    {
      id: 'row-birch',
      cells: {
        sku: 'WC-318',
        plant: 'River birch',
        size: '15 gal',
        qty: '4',
        unit: 'pot',
        notes: 'Hold for Rivera. Call if the root ball is dry.',
      },
    },
    {
      id: 'row-sedum',
      cells: {
        sku: 'WC-409',
        plant: 'Sedum Autumn Joy',
        size: '1 qt',
        qty: '36',
        unit: 'pot',
        notes: '',
      },
    },
    {
      id: 'row-fern',
      cells: {
        sku: 'WC-512',
        plant: 'Ostrich fern',
        size: '1 gal',
        qty: '18',
        unit: 'pot',
        notes: 'Shade house',
      },
    },
  ],
}

export const sampleWorkspace = {
  title: 'Tables',
  tables: [sampleTable],
}

export const sampleEmptyTable = {
  id: 'table-blank',
  title: 'New table',
  columns: [
    { id: 'sku', name: 'SKU' },
    { id: 'plant', name: 'Plant' },
    { id: 'size', name: 'Size' },
    { id: 'qty', name: 'Qty' },
    { id: 'unit', name: 'Unit' },
    { id: 'notes', name: 'Notes' },
  ],
  rows: [],
}
