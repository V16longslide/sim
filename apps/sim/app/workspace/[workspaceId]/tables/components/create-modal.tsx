'use client'

import { useMemo, useState } from 'react'
import { createLogger } from '@sim/logger'
import { Plus } from 'lucide-react'
import { nanoid } from 'nanoid'
import { useParams } from 'next/navigation'
import {
  Button,
  Checkbox,
  Combobox,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
  Tooltip,
} from '@/components/emcn'
import { Trash } from '@/components/emcn/icons/trash'
import type { ColumnDefinition } from '@/lib/table'
import { useCreateTable } from '@/hooks/queries/use-tables'

const logger = createLogger('CreateModal')

interface CreateModalProps {
  isOpen: boolean
  onClose: () => void
}

const COLUMN_TYPE_OPTIONS: Array<{ value: ColumnDefinition['type']; label: string }> = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'json', label: 'JSON' },
]

interface ColumnWithId extends ColumnDefinition {
  id: string
}

function createEmptyColumn(): ColumnWithId {
  return { id: nanoid(), name: '', type: 'string', required: true, unique: false }
}

export function CreateModal({ isOpen, onClose }: CreateModalProps) {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [tableName, setTableName] = useState('')
  const [description, setDescription] = useState('')
  const [columns, setColumns] = useState<ColumnWithId[]>([createEmptyColumn()])
  const [error, setError] = useState<string | null>(null)

  const createTable = useCreateTable(workspaceId)

  // Form validation
  const validColumns = useMemo(() => columns.filter((col) => col.name.trim()), [columns])
  const duplicateColumnNames = useMemo(() => {
    const names = validColumns.map((col) => col.name.toLowerCase())
    const seen = new Set<string>()
    const duplicates = new Set<string>()
    names.forEach((name) => {
      if (seen.has(name)) {
        duplicates.add(name)
      }
      seen.add(name)
    })
    return duplicates
  }, [validColumns])

  const isFormValid = useMemo(() => {
    const hasTableName = tableName.trim().length > 0
    const hasAtLeastOneColumn = validColumns.length > 0
    const hasNoDuplicates = duplicateColumnNames.size === 0
    return hasTableName && hasAtLeastOneColumn && hasNoDuplicates
  }, [tableName, validColumns.length, duplicateColumnNames.size])

  const handleAddColumn = () => {
    setColumns([...columns, createEmptyColumn()])
  }

  const handleRemoveColumn = (columnId: string) => {
    if (columns.length > 1) {
      setColumns(columns.filter((col) => col.id !== columnId))
    }
  }

  const handleColumnChange = (
    columnId: string,
    field: keyof ColumnDefinition,
    value: string | boolean
  ) => {
    setColumns(columns.map((col) => (col.id === columnId ? { ...col, [field]: value } : col)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!tableName.trim()) {
      setError('Table name is required')
      return
    }

    // Validate column names
    const validColumns = columns.filter((col) => col.name.trim())
    if (validColumns.length === 0) {
      setError('At least one column is required')
      return
    }

    // Check for duplicate column names
    const columnNames = validColumns.map((col) => col.name.toLowerCase())
    const uniqueNames = new Set(columnNames)
    if (uniqueNames.size !== columnNames.length) {
      setError('Duplicate column names found')
      return
    }

    // Strip internal IDs before sending to API
    const columnsForApi = validColumns.map(({ id: _id, ...col }) => col)

    try {
      await createTable.mutateAsync({
        name: tableName,
        description: description || undefined,
        schema: {
          columns: columnsForApi,
        },
      })

      // Reset form
      resetForm()
      onClose()
    } catch (err) {
      logger.error('Failed to create table:', err)
      setError(err instanceof Error ? err.message : 'Failed to create table')
    }
  }

  const resetForm = () => {
    setTableName('')
    setDescription('')
    setColumns([createEmptyColumn()])
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal open={isOpen} onOpenChange={handleClose}>
      <ModalContent size='lg'>
        <ModalHeader>Create New Table</ModalHeader>
        <ModalBody className='max-h-[70vh] overflow-y-auto'>
          <form onSubmit={handleSubmit} className='space-y-[12px]'>
            {error && (
              <div className='rounded-[4px] border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm'>
                {error}
              </div>
            )}

            {/* Table Name */}
            <div>
              <Label
                htmlFor='tableName'
                className='mb-[6.5px] block pl-[2px] font-medium text-[13px] text-[var(--text-primary)]'
              >
                Table Name
              </Label>
              <Input
                id='tableName'
                value={tableName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTableName(e.target.value)}
                placeholder='e.g., customer_orders'
                className='h-9'
              />
            </div>

            {/* Description */}
            <div>
              <Label
                htmlFor='description'
                className='mb-[6.5px] block pl-[2px] font-medium text-[13px] text-[var(--text-primary)]'
              >
                Description
              </Label>
              <Textarea
                id='description'
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                placeholder='Optional description for this table'
                rows={2}
                className='resize-none'
              />
            </div>

            {/* Columns */}
            <div>
              <div className='mb-[6.5px] flex items-center justify-between pl-[2px]'>
                <Label className='font-medium text-[13px] text-[var(--text-primary)]'>
                  Columns
                </Label>
                <Button type='button' size='sm' variant='default' onClick={handleAddColumn}>
                  <Plus className='mr-1 h-3.5 w-3.5' />
                  Add
                </Button>
              </div>

              {/* Column Headers */}
              <div className='mb-2 flex items-center gap-[10px] text-[11px] text-[var(--text-secondary)]'>
                <div className='flex-1 pl-3'>Name</div>
                <div className='w-[110px] pl-3'>Type</div>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div className='w-[70px] cursor-help text-center'>Required</div>
                  </Tooltip.Trigger>
                  <Tooltip.Content>Field must have a value</Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <div className='w-[70px] cursor-help text-center'>Unique</div>
                  </Tooltip.Trigger>
                  <Tooltip.Content>No duplicate values allowed</Tooltip.Content>
                </Tooltip.Root>
                <div className='w-9' />
              </div>

              {/* Column Rows */}
              <div className='flex flex-col gap-2'>
                {columns.map((column) => (
                  <ColumnRow
                    key={column.id}
                    column={column}
                    isRemovable={columns.length > 1}
                    isDuplicate={duplicateColumnNames.has(column.name.toLowerCase())}
                    onChange={handleColumnChange}
                    onRemove={handleRemoveColumn}
                  />
                ))}
              </div>

              <p className='mt-[6.5px] text-[11px] text-[var(--text-secondary)]'>
                Mark columns as unique to prevent duplicate values (e.g., id, email)
              </p>
            </div>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant='default' onClick={handleClose} disabled={createTable.isPending}>
            Cancel
          </Button>
          <Button
            variant='tertiary'
            onClick={handleSubmit}
            disabled={createTable.isPending || !isFormValid}
          >
            {createTable.isPending ? 'Creating...' : 'Create'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

interface ColumnRowProps {
  column: ColumnWithId
  isRemovable: boolean
  isDuplicate: boolean
  onChange: (columnId: string, field: keyof ColumnDefinition, value: string | boolean) => void
  onRemove: (columnId: string) => void
}

function ColumnRow({ column, isRemovable, isDuplicate, onChange, onRemove }: ColumnRowProps) {
  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-[10px]'>
        {/* Column Name */}
        <div className='flex-1'>
          <Input
            value={column.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange(column.id, 'name', e.target.value)
            }
            placeholder='column_name'
            className={`h-9 ${isDuplicate ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          />
        </div>

        {/* Column Type */}
        <div className='w-[110px]'>
          <Combobox
            options={COLUMN_TYPE_OPTIONS}
            value={column.type}
            selectedValue={column.type}
            onChange={(value) => onChange(column.id, 'type', value as ColumnDefinition['type'])}
            placeholder='Type'
            editable={false}
            filterOptions={false}
            className='h-9'
          />
        </div>

        {/* Required Checkbox */}
        <div className='flex w-[70px] items-center justify-center'>
          <Checkbox
            checked={column.required}
            onCheckedChange={(checked) => onChange(column.id, 'required', checked === true)}
          />
        </div>

        {/* Unique Checkbox */}
        <div className='flex w-[70px] items-center justify-center'>
          <Checkbox
            checked={column.unique}
            onCheckedChange={(checked) => onChange(column.id, 'unique', checked === true)}
          />
        </div>

        {/* Delete Button */}
        <div className='w-9'>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button
                type='button'
                variant='ghost'
                onClick={() => onRemove(column.id)}
                disabled={!isRemovable}
                className='h-9 w-9 p-0'
              >
                <Trash />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Remove column</Tooltip.Content>
          </Tooltip.Root>
        </div>
      </div>
      {isDuplicate && <p className='mt-1 pl-1 text-destructive text-sm'>Duplicate column name</p>}
    </div>
  )
}
