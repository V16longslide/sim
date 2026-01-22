'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button, Combobox, Input } from '@/components/emcn'
import type { FilterRule } from '@/lib/table/query-builder/constants'
import { filterRulesToFilter } from '@/lib/table/query-builder/converters'
import { useFilterBuilder } from '@/lib/table/query-builder/use-query-builder'
import type { ColumnDefinition } from '@/lib/table/types'
import type { QueryOptions } from '../lib/types'

type Column = Pick<ColumnDefinition, 'name' | 'type'>

interface FilterPanelProps {
  columns: Column[]
  isVisible: boolean
  onApply: (options: QueryOptions) => void
  onClose: () => void
  isLoading?: boolean
}

// Operators that don't need a value input
const NO_VALUE_OPERATORS = ['is_null', 'is_not_null']

// Options for the first filter row
const WHERE_OPTIONS = [{ value: 'where', label: 'where' }]

export function FilterPanel({
  columns,
  isVisible,
  onApply,
  onClose,
  isLoading = false,
}: FilterPanelProps) {
  const [rules, setRules] = useState<FilterRule[]>([])

  const columnOptions = useMemo(
    () => columns.map((col) => ({ value: col.name, label: col.name })),
    [columns]
  )

  const {
    comparisonOptions,
    logicalOptions,
    addRule: handleAddRule,
    removeRule: handleRemoveRule,
    updateRule: handleUpdateRule,
  } = useFilterBuilder({
    columns: columnOptions,
    rules,
    setRules,
  })

  // Auto-add first filter when panel opens with no filters
  useEffect(() => {
    if (isVisible && rules.length === 0 && columns.length > 0) {
      handleAddRule()
    }
  }, [isVisible, rules.length, columns.length, handleAddRule])

  const handleApply = useCallback(() => {
    const filter = filterRulesToFilter(rules)
    onApply({ filter, sort: null })
  }, [rules, onApply])

  const handleClear = useCallback(() => {
    setRules([])
    onApply({ filter: null, sort: null })
    onClose()
  }, [onApply, onClose])

  if (!isVisible) {
    return null
  }

  return (
    <div className='flex shrink-0 flex-col gap-2 border-[var(--border)] border-b px-4 py-3'>
      {rules.map((rule, index) => {
        const needsValue = !NO_VALUE_OPERATORS.includes(rule.operator)
        const isFirst = index === 0

        return (
          <div key={rule.id} className='flex items-center gap-2'>
            {/* Remove button */}
            <Button
              variant='ghost'
              size='sm'
              onClick={() => handleRemoveRule(rule.id)}
              aria-label='Remove filter'
              className='shrink-0 p-1'
            >
              <X className='h-3.5 w-3.5' />
            </Button>

            {/* Where / And / Or */}
            <div className='w-20 shrink-0'>
              {isFirst ? (
                <Combobox size='sm' options={WHERE_OPTIONS} value='where' onChange={() => {}} />
              ) : (
                <Combobox
                  size='sm'
                  options={logicalOptions}
                  value={rule.logicalOperator}
                  onChange={(value) =>
                    handleUpdateRule(rule.id, 'logicalOperator', value as 'and' | 'or')
                  }
                />
              )}
            </div>

            {/* Column */}
            <div className='w-[140px] shrink-0'>
              <Combobox
                size='sm'
                options={columnOptions}
                value={rule.column}
                onChange={(value) => handleUpdateRule(rule.id, 'column', value)}
                placeholder='Column'
              />
            </div>

            {/* Operator */}
            <div className='w-[120px] shrink-0'>
              <Combobox
                size='sm'
                options={comparisonOptions}
                value={rule.operator}
                onChange={(value) => handleUpdateRule(rule.id, 'operator', value)}
              />
            </div>

            {/* Value (only if operator needs it) */}
            {needsValue && (
              <Input
                className='w-[160px] shrink-0'
                value={rule.value}
                onChange={(e) => handleUpdateRule(rule.id, 'value', e.target.value)}
                placeholder='Enter a value'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApply()
                  }
                }}
              />
            )}

            {/* Actions - only on first row */}
            {isFirst && (
              <div className='ml-1 flex items-center gap-1'>
                <Button variant='tertiary' size='sm' onClick={handleApply} disabled={isLoading}>
                  Apply
                </Button>

                <Button variant='ghost' size='sm' onClick={handleAddRule}>
                  <Plus className='h-3 w-3' />
                  Add filter
                </Button>

                <Button variant='ghost' size='sm' onClick={handleClear}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
