export type SortOption = 'name' | 'createdAt' | 'updatedAt' | 'rowCount' | 'columnCount'
export type SortOrder = 'asc' | 'desc'

export const SORT_OPTIONS = [
  { value: 'updatedAt-desc', label: 'Last Updated' },
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'name-asc', label: 'Name (A-Z)' },
  { value: 'name-desc', label: 'Name (Z-A)' },
  { value: 'rowCount-desc', label: 'Most Rows' },
  { value: 'rowCount-asc', label: 'Least Rows' },
  { value: 'columnCount-desc', label: 'Most Columns' },
  { value: 'columnCount-asc', label: 'Least Columns' },
] as const
