'use client'

import { useCallback, useState } from 'react'
import { createLogger } from '@sim/logger'
import { nanoid } from 'nanoid'
import type { ColumnDefinition } from '@/lib/table'

const logger = createLogger('useInlineEditing')

export interface TempRow {
  tempId: string
  data: Record<string, unknown>
  isNew: true
}

interface UseInlineEditingProps {
  workspaceId: string
  tableId: string
  columns: ColumnDefinition[]
  onSuccess: () => void
}

interface UseInlineEditingReturn {
  newRows: TempRow[]
  pendingChanges: Map<string, Record<string, unknown>>
  addNewRow: () => void
  updateNewRowCell: (tempId: string, column: string, value: unknown) => void
  updateExistingRowCell: (rowId: string, column: string, value: unknown) => void
  saveChanges: () => Promise<void>
  discardChanges: () => void
  hasPendingChanges: boolean
  isSaving: boolean
  error: string | null
}

function createInitialRowData(columns: ColumnDefinition[]): Record<string, unknown> {
  const initial: Record<string, unknown> = {}
  columns.forEach((col) => {
    if (col.type === 'boolean') {
      initial[col.name] = false
    } else {
      initial[col.name] = null
    }
  })
  return initial
}

function cleanRowData(
  columns: ColumnDefinition[],
  rowData: Record<string, unknown>
): Record<string, unknown> {
  const cleanData: Record<string, unknown> = {}

  columns.forEach((col) => {
    const value = rowData[col.name]
    if (col.type === 'number') {
      cleanData[col.name] = value === '' || value === null ? null : Number(value)
    } else if (col.type === 'json') {
      if (typeof value === 'string') {
        if (value === '') {
          cleanData[col.name] = null
        } else {
          try {
            cleanData[col.name] = JSON.parse(value)
          } catch {
            throw new Error(`Invalid JSON for field: ${col.name}`)
          }
        }
      } else {
        cleanData[col.name] = value
      }
    } else if (col.type === 'boolean') {
      cleanData[col.name] = Boolean(value)
    } else {
      cleanData[col.name] = value || null
    }
  })

  return cleanData
}

export function useInlineEditing({
  workspaceId,
  tableId,
  columns,
  onSuccess,
}: UseInlineEditingProps): UseInlineEditingReturn {
  const [newRows, setNewRows] = useState<TempRow[]>([])
  const [pendingChanges, setPendingChanges] = useState<Map<string, Record<string, unknown>>>(
    new Map()
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasPendingChanges = newRows.length > 0 || pendingChanges.size > 0

  const addNewRow = useCallback(() => {
    const newRow: TempRow = {
      tempId: `temp-${nanoid()}`,
      data: createInitialRowData(columns),
      isNew: true,
    }
    setNewRows((prev) => [newRow, ...prev])
  }, [columns])

  const updateNewRowCell = useCallback((tempId: string, column: string, value: unknown) => {
    setNewRows((prev) =>
      prev.map((row) =>
        row.tempId === tempId ? { ...row, data: { ...row.data, [column]: value } } : row
      )
    )
  }, [])

  const updateExistingRowCell = useCallback((rowId: string, column: string, value: unknown) => {
    setPendingChanges((prev) => {
      const newMap = new Map(prev)
      const existing = newMap.get(rowId) || {}
      newMap.set(rowId, { ...existing, [column]: value })
      return newMap
    })
  }, [])

  const saveChanges = useCallback(async () => {
    setIsSaving(true)
    setError(null)

    try {
      // Save new rows
      for (const newRow of newRows) {
        const cleanData = cleanRowData(columns, newRow.data)

        const res = await fetch(`/api/table/${tableId}/rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, data: cleanData }),
        })

        const result: { error?: string } = await res.json()
        if (!res.ok) {
          throw new Error(result.error || 'Failed to add row')
        }
      }

      // Save edited rows
      for (const [rowId, changes] of pendingChanges.entries()) {
        const cleanData = cleanRowData(columns, changes)

        const res = await fetch(`/api/table/${tableId}/rows/${rowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, data: cleanData }),
        })

        const result: { error?: string } = await res.json()
        if (!res.ok) {
          throw new Error(result.error || 'Failed to update row')
        }
      }

      // Clear state and refresh
      setNewRows([])
      setPendingChanges(new Map())
      onSuccess()

      logger.info('Changes saved successfully')
    } catch (err) {
      logger.error('Failed to save changes:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }, [newRows, pendingChanges, columns, tableId, workspaceId, onSuccess])

  const discardChanges = useCallback(() => {
    setNewRows([])
    setPendingChanges(new Map())
    setError(null)
  }, [])

  return {
    newRows,
    pendingChanges,
    addNewRow,
    updateNewRowCell,
    updateExistingRowCell,
    saveChanges,
    discardChanges,
    hasPendingChanges,
    isSaving,
    error,
  }
}
