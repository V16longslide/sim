'use client'

import { X } from 'lucide-react'
import { Button, TableCell, TableRow } from '@/components/emcn'
import type { ColumnDefinition } from '@/lib/table'
import type { TempRow } from '../hooks/use-inline-editing'
import { EditableCell } from './editable-cell'

interface EditableRowProps {
  row: TempRow
  columns: ColumnDefinition[]
  onUpdateCell: (tempId: string, column: string, value: unknown) => void
  onRemove: (tempId: string) => void
}

export function EditableRow({ row, columns, onUpdateCell, onRemove }: EditableRowProps) {
  return (
    <TableRow className='bg-amber-500/20 hover:bg-amber-500/30'>
      <TableCell className='w-[40px]'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => onRemove(row.tempId)}
          className='h-[20px] w-[20px] p-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
        >
          <X className='h-[12px] w-[12px]' />
        </Button>
      </TableCell>
      {columns.map((column) => (
        <TableCell key={column.name}>
          <EditableCell
            value={row.data[column.name]}
            column={column}
            onChange={(value) => onUpdateCell(row.tempId, column.name, value)}
            isNew
          />
        </TableCell>
      ))}
    </TableRow>
  )
}
