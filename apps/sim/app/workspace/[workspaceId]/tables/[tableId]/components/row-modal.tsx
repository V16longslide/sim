'use client'

import { useEffect, useMemo, useState } from 'react'
import { createLogger } from '@sim/logger'
import { useParams } from 'next/navigation'
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from '@/components/emcn'
import type { ColumnDefinition, TableInfo, TableRow } from '@/lib/table'

const logger = createLogger('RowModal')

export interface RowModalProps {
  mode: 'add' | 'edit' | 'delete'
  isOpen: boolean
  onClose: () => void
  table: TableInfo
  row?: TableRow
  rowIds?: string[]
  onSuccess: () => void
}

function createInitialRowData(columns: ColumnDefinition[]): Record<string, unknown> {
  const initial: Record<string, unknown> = {}
  columns.forEach((col) => {
    if (col.type === 'boolean') {
      initial[col.name] = false
    } else {
      initial[col.name] = ''
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
      cleanData[col.name] = value === '' ? null : Number(value)
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

function formatValueForInput(value: unknown, type: string): string {
  if (value === null || value === undefined) return ''
  if (type === 'json') {
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2)
  }
  if (type === 'date' && value) {
    try {
      const date = new Date(String(value))
      return date.toISOString().split('T')[0]
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function isFieldEmpty(value: unknown, type: string): boolean {
  if (value === null || value === undefined) return true
  if (type === 'boolean') return false // booleans always have a value (true/false)
  if (typeof value === 'string') return value.trim() === ''
  return false
}

export function RowModal({ mode, isOpen, onClose, table, row, rowIds, onSuccess }: RowModalProps) {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const schema = table?.schema
  const columns = schema?.columns || []

  const [rowData, setRowData] = useState<Record<string, unknown>>({})
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Check if all required fields are filled
  const hasRequiredFields = useMemo(() => {
    const requiredColumns = columns.filter((col) => col.required)
    return requiredColumns.every((col) => !isFieldEmpty(rowData[col.name], col.type))
  }, [columns, rowData])

  // Initialize form data based on mode
  useEffect(() => {
    if (!isOpen) return

    if (mode === 'add' && columns.length > 0) {
      setRowData(createInitialRowData(columns))
    } else if (mode === 'edit' && row) {
      setRowData(row.data)
    }
  }, [isOpen, mode, columns, row])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const cleanData = cleanRowData(columns, rowData)

      if (mode === 'add') {
        const res = await fetch(`/api/table/${table?.id}/rows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, data: cleanData }),
        })

        const result: { error?: string } = await res.json()
        if (!res.ok) {
          throw new Error(result.error || 'Failed to add row')
        }
      } else if (mode === 'edit' && row) {
        const res = await fetch(`/api/table/${table?.id}/rows/${row.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId, data: cleanData }),
        })

        const result: { error?: string } = await res.json()
        if (!res.ok) {
          throw new Error(result.error || 'Failed to update row')
        }
      }

      onSuccess()
    } catch (err) {
      logger.error(`Failed to ${mode} row:`, err)
      setError(err instanceof Error ? err.message : `Failed to ${mode} row`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setError(null)
    setIsSubmitting(true)

    const idsToDelete = rowIds ?? (row ? [row.id] : [])

    try {
      if (idsToDelete.length === 1) {
        const res = await fetch(`/api/table/${table?.id}/rows/${idsToDelete[0]}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workspaceId }),
        })

        if (!res.ok) {
          const result: { error?: string } = await res.json()
          throw new Error(result.error || 'Failed to delete row')
        }
      } else {
        const results = await Promise.allSettled(
          idsToDelete.map(async (rowId) => {
            const res = await fetch(`/api/table/${table?.id}/rows/${rowId}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ workspaceId }),
            })

            if (!res.ok) {
              const result: { error?: string } = await res.json().catch(() => ({}))
              throw new Error(result.error || `Failed to delete row ${rowId}`)
            }

            return rowId
          })
        )

        const failures = results.filter((r) => r.status === 'rejected')

        if (failures.length > 0) {
          const failureCount = failures.length
          const totalCount = idsToDelete.length
          const successCount = totalCount - failureCount
          const firstError =
            failures[0].status === 'rejected' ? failures[0].reason?.message || 'Unknown error' : ''

          throw new Error(
            `Failed to delete ${failureCount} of ${totalCount} row(s)${successCount > 0 ? ` (${successCount} deleted successfully)` : ''}. ${firstError}`
          )
        }
      }

      onSuccess()
    } catch (err) {
      logger.error('Failed to delete row(s):', err)
      setError(err instanceof Error ? err.message : 'Failed to delete row(s)')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setRowData({})
    setError(null)
    onClose()
  }

  // Delete mode UI
  if (mode === 'delete') {
    const deleteCount = rowIds?.length ?? (row ? 1 : 0)
    const isSingleRow = deleteCount === 1

    return (
      <Modal open={isOpen} onOpenChange={handleClose}>
        <ModalContent size='sm'>
          <ModalHeader>Delete {isSingleRow ? 'Row' : `${deleteCount} Rows`}</ModalHeader>
          <ModalBody>
            <ErrorMessage error={error} />
            <p className='text-[12px] text-[var(--text-secondary)]'>
              Are you sure you want to delete{' '}
              <span className='font-medium text-[var(--text-primary)]'>
                {isSingleRow ? '1 row' : `${deleteCount} rows`}
              </span>
              ? This will permanently remove the data.{' '}
              <span className='text-[var(--text-error)]'>This action cannot be undone.</span>
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant='default' onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    )
  }

  const isAddMode = mode === 'add'

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent className='max-w-[480px]'>
        <ModalHeader>{isAddMode ? 'Add New Row' : 'Edit Row'}</ModalHeader>
        <ModalBody className='max-h-[60vh] space-y-[12px] overflow-y-auto'>
          <ErrorMessage error={error} />

          <div className='flex flex-col gap-[8px]'>
            {columns.map((column) => (
              <ColumnField
                key={column.name}
                column={column}
                value={rowData[column.name]}
                onChange={(value) => setRowData((prev) => ({ ...prev, [column.name]: value }))}
              />
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant='default' onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant='tertiary'
            onClick={handleFormSubmit}
            disabled={isSubmitting || !hasRequiredFields}
          >
            {isSubmitting
              ? isAddMode
                ? 'Adding...'
                : 'Updating...'
              : isAddMode
                ? 'Add Row'
                : 'Update Row'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

function ErrorMessage({ error }: { error: string | null }) {
  if (!error) return null

  return (
    <div className='rounded-[8px] border border-[var(--status-error-border)] bg-[var(--status-error-bg)] px-[14px] py-[12px] text-[13px] text-[var(--status-error-text)]'>
      {error}
    </div>
  )
}

interface ColumnFieldProps {
  column: ColumnDefinition
  value: unknown
  onChange: (value: unknown) => void
}

function ColumnField({ column, value, onChange }: ColumnFieldProps) {
  const renderInput = () => {
    if (column.type === 'boolean') {
      return (
        <div className='flex items-center gap-[8px]'>
          <Checkbox
            id={column.name}
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked === true)}
          />
          <Label
            htmlFor={column.name}
            className='font-normal text-[13px] text-[var(--text-tertiary)]'
          >
            {value ? 'True' : 'False'}
          </Label>
        </div>
      )
    }

    if (column.type === 'json') {
      return (
        <Textarea
          id={column.name}
          value={formatValueForInput(value, column.type)}
          onChange={(e) => onChange(e.target.value)}
          placeholder='{"key": "value"}'
          rows={3}
          className='font-mono text-[12px]'
          required={column.required}
        />
      )
    }

    return (
      <Input
        id={column.name}
        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
        value={formatValueForInput(value, column.type)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${column.name}`}
        required={column.required}
      />
    )
  }

  return (
    <div className='overflow-hidden rounded-[4px] border border-[var(--border-1)]'>
      <div className='flex items-center justify-between bg-[var(--surface-4)] px-[10px] py-[5px]'>
        <div className='flex min-w-0 flex-1 items-center gap-[8px]'>
          <span className='block truncate font-medium text-[14px] text-[var(--text-tertiary)]'>
            {column.name}
            {column.required && <span className='text-[var(--text-error)]'> *</span>}
          </span>
          <Badge size='sm'>{column.type}</Badge>
          {column.unique && (
            <Badge size='sm' variant='gray-secondary'>
              unique
            </Badge>
          )}
        </div>
      </div>
      <div className='border-[var(--border-1)] border-t px-[10px] pt-[6px] pb-[10px]'>
        <div className='flex flex-col gap-[6px]'>
          <Label className='text-[13px]'>Value</Label>
          {renderInput()}
        </div>
      </div>
    </div>
  )
}
