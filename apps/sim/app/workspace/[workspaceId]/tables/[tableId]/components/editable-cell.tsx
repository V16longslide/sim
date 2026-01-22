'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Checkbox, Input, Textarea } from '@/components/emcn'
import { cn } from '@/lib/core/utils/cn'
import type { ColumnDefinition } from '@/lib/table'

interface EditableCellProps {
  value: unknown
  column: ColumnDefinition
  onChange: (value: unknown) => void
  isEditing?: boolean
  isNew?: boolean
}

function formatValueForDisplay(value: unknown, type: string): string {
  if (value === null || value === undefined) return 'NULL'
  if (type === 'json') {
    return typeof value === 'string' ? value : JSON.stringify(value)
  }
  if (type === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
  }
  if (type === 'date' && value) {
    try {
      const date = new Date(String(value))
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return String(value)
    }
  }
  return String(value)
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

export function EditableCell({
  value,
  column,
  onChange,
  isEditing = false,
  isNew = false,
}: EditableCellProps) {
  const [localValue, setLocalValue] = useState<unknown>(value)
  const [isActive, setIsActive] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isActive])

  const handleFocus = useCallback(() => {
    setIsActive(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsActive(false)
    if (localValue !== value) {
      onChange(localValue)
    }
  }, [localValue, value, onChange])

  const handleChange = useCallback((newValue: unknown) => {
    setLocalValue(newValue)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && column.type !== 'json') {
        e.preventDefault()
        ;(e.target as HTMLElement).blur()
      }
      if (e.key === 'Escape') {
        setLocalValue(value)
        ;(e.target as HTMLElement).blur()
      }
    },
    [value, column.type]
  )

  const isNull = value === null || value === undefined

  // Boolean type - always show checkbox
  if (column.type === 'boolean') {
    return (
      <div className='flex items-center'>
        <Checkbox
          size='sm'
          checked={Boolean(localValue)}
          onCheckedChange={(checked) => {
            const newValue = checked === true
            setLocalValue(newValue)
            onChange(newValue)
          }}
        />
        <span
          className={cn(
            'ml-[8px] text-[12px]',
            localValue ? 'text-green-500' : 'text-[var(--text-tertiary)]'
          )}
        >
          {localValue ? 'TRUE' : 'FALSE'}
        </span>
      </div>
    )
  }

  // JSON type - use textarea
  if (column.type === 'json') {
    if (isActive || isNew) {
      return (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={formatValueForInput(localValue, column.type)}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className='h-[60px] min-w-[200px] resize-none font-mono text-[11px]'
          placeholder='{"key": "value"}'
        />
      )
    }

    return (
      <button
        type='button'
        onClick={handleFocus}
        className={cn(
          'group flex max-w-[300px] cursor-pointer items-center truncate text-left font-mono text-[11px] transition-colors',
          isNull
            ? 'text-[var(--text-muted)] italic'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        )}
      >
        <span className='truncate'>{formatValueForDisplay(value, column.type)}</span>
        <ChevronRight className='ml-[4px] h-[10px] w-[10px] opacity-0 group-hover:opacity-100' />
      </button>
    )
  }

  // Active/editing state for other types
  if (isActive || isNew) {
    return (
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type={column.type === 'number' ? 'number' : column.type === 'date' ? 'date' : 'text'}
        value={formatValueForInput(localValue, column.type)}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-[28px] min-w-[120px] text-[12px]',
          column.type === 'number' && 'font-mono'
        )}
        placeholder={isNull ? 'NULL' : ''}
      />
    )
  }

  // Display state
  return (
    <button
      type='button'
      onClick={handleFocus}
      className={cn(
        'group flex max-w-[300px] cursor-pointer items-center truncate text-left text-[13px] transition-colors',
        isNull
          ? 'text-[var(--text-muted)] italic'
          : column.type === 'number'
            ? 'font-mono text-[12px] text-[var(--text-secondary)]'
            : 'text-[var(--text-primary)]'
      )}
    >
      <span className='truncate'>{formatValueForDisplay(value, column.type)}</span>
      <ChevronRight className='ml-[4px] h-[10px] w-[10px] opacity-0 group-hover:opacity-100' />
    </button>
  )
}
