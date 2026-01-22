import type { TableDefinition } from '@/lib/table'
import type { SortOption, SortOrder } from '../components/constants'

/**
 * Sort tables by the specified field and order
 */
export function sortTables(
  tables: TableDefinition[],
  sortBy: SortOption,
  sortOrder: SortOrder
): TableDefinition[] {
  return [...tables].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'createdAt':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'updatedAt':
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        break
      case 'rowCount':
        comparison = a.rowCount - b.rowCount
        break
      case 'columnCount':
        comparison = a.schema.columns.length - b.schema.columns.length
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })
}

/**
 * Filter tables by search query
 */
export function filterTables(tables: TableDefinition[], searchQuery: string): TableDefinition[] {
  if (!searchQuery.trim()) {
    return tables
  }

  const query = searchQuery.toLowerCase()
  return tables.filter(
    (table) =>
      table.name.toLowerCase().includes(query) || table.description?.toLowerCase().includes(query)
  )
}

/**
 * Formats a date as relative time (e.g., "5m ago", "2d ago")
 */
export function formatRelativeTime(dateValue: string | Date): string {
  const dateString = typeof dateValue === 'string' ? dateValue : dateValue.toISOString()
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`
  return `${Math.floor(diffInSeconds / 31536000)}y ago`
}

/**
 * Formats a date as absolute date string (e.g., "Jan 15, 2024, 10:30 AM")
 */
export function formatAbsoluteDate(dateValue: string | Date): string {
  const dateString = typeof dateValue === 'string' ? dateValue : dateValue.toISOString()
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
