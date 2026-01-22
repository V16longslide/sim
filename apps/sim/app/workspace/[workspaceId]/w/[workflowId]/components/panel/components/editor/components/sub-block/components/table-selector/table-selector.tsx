'use client'

import { useCallback, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Combobox, type ComboboxOption } from '@/components/emcn'
import { useSubBlockValue } from '@/app/workspace/[workspaceId]/w/[workflowId]/components/panel/components/editor/components/sub-block/hooks/use-sub-block-value'
import type { SubBlockConfig } from '@/blocks/types'
import { useTablesList } from '@/hooks/queries/use-tables'

interface TableSelectorProps {
  blockId: string
  subBlock: SubBlockConfig
  disabled?: boolean
  isPreview?: boolean
  previewValue?: string | null
}

/**
 * Table selector component for selecting workspace tables
 *
 * @remarks
 * Provides a combobox to select workspace tables.
 * Uses React Query for efficient data fetching and caching.
 * The external link to navigate to the table is shown in the label area.
 */
export function TableSelector({
  blockId,
  subBlock,
  disabled = false,
  isPreview = false,
  previewValue,
}: TableSelectorProps) {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  const [storeValue, setStoreValue] = useSubBlockValue<string>(blockId, subBlock.id)

  // Use React Query hook for table data - it handles caching, loading, and error states
  const {
    data: tables = [],
    isLoading,
    error,
  } = useTablesList(isPreview || disabled ? undefined : workspaceId)

  const value = isPreview ? previewValue : storeValue
  const tableId = typeof value === 'string' ? value : null

  const options = useMemo<ComboboxOption[]>(() => {
    return tables.map((table) => ({
      label: table.name.toLowerCase(),
      value: table.id,
    }))
  }, [tables])

  const handleChange = useCallback(
    (selectedValue: string) => {
      if (isPreview || disabled) return
      setStoreValue(selectedValue)
    },
    [isPreview, disabled, setStoreValue]
  )

  // Convert error object to string if needed
  const errorMessage = error instanceof Error ? error.message : error ? String(error) : undefined

  return (
    <Combobox
      options={options}
      value={tableId ?? undefined}
      onChange={handleChange}
      placeholder={subBlock.placeholder || 'Select a table'}
      disabled={disabled || isPreview}
      editable={false}
      isLoading={isLoading}
      error={errorMessage}
      searchable={options.length > 5}
      searchPlaceholder='Search...'
    />
  )
}
