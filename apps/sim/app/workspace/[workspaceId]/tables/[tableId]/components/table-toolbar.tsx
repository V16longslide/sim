'use client'

import {
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import {
  Button,
  Popover,
  PopoverContent,
  PopoverItem,
  PopoverTrigger,
  Tooltip,
} from '@/components/emcn'
import { Skeleton } from '@/components/ui/skeleton'

interface TableToolbarProps {
  tableName: string
  totalCount: number
  isLoading: boolean
  onNavigateBack: () => void
  onShowSchema: () => void
  onRefresh: () => void
  showFilters: boolean
  onToggleFilters: () => void
  onAddRecord: () => void
  selectedCount: number
  onDeleteSelected: () => void
  onClearSelection: () => void
  hasPendingChanges: boolean
  onSaveChanges: () => void
  onDiscardChanges: () => void
  isSaving: boolean
  currentPage: number
  totalPages: number
  onPreviousPage: () => void
  onNextPage: () => void
}

export function TableToolbar({
  tableName,
  totalCount,
  isLoading,
  onNavigateBack,
  onShowSchema,
  onRefresh,
  showFilters,
  onToggleFilters,
  onAddRecord,
  selectedCount,
  onDeleteSelected,
  onClearSelection,
  hasPendingChanges,
  onSaveChanges,
  onDiscardChanges,
  isSaving,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
}: TableToolbarProps) {
  const hasSelection = selectedCount > 0

  return (
    <div className='flex h-[48px] shrink-0 items-center justify-between border-[var(--border)] border-b bg-[var(--surface-2)] px-[16px]'>
      {/* Left section: Navigation and table info */}
      <div className='flex items-center gap-[8px]'>
        <button
          onClick={onNavigateBack}
          className='text-[13px] text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]'
        >
          Tables
        </button>
        <span className='text-[var(--text-muted)]'>/</span>
        <span className='font-medium text-[13px] text-[var(--text-primary)]'>{tableName}</span>
      </div>

      {/* Center section: Main actions */}
      <div className='flex items-center gap-[8px]'>
        {/* Pagination controls */}
        <div className='flex items-center gap-[2px]'>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button
                variant='ghost'
                size='sm'
                onClick={onPreviousPage}
                disabled={currentPage === 0 || isLoading}
              >
                <ChevronLeft className='h-[14px] w-[14px]' />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Previous page</Tooltip.Content>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Button
                variant='ghost'
                size='sm'
                onClick={onNextPage}
                disabled={currentPage >= totalPages - 1 || isLoading}
              >
                <ChevronRight className='h-[14px] w-[14px]' />
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content>Next page</Tooltip.Content>
          </Tooltip.Root>
        </div>

        <div className='mx-[4px] h-[20px] w-[1px] bg-[var(--border)]' />

        {/* Filters toggle */}
        <Button variant={showFilters ? 'secondary' : 'ghost'} size='sm' onClick={onToggleFilters}>
          <Filter className='mr-[4px] h-[12px] w-[12px]' />
          Filters
        </Button>

        <div className='mx-[4px] h-[20px] w-[1px] bg-[var(--border)]' />

        {/* Pending changes actions */}
        {hasPendingChanges ? (
          <>
            <Button variant='tertiary' size='sm' onClick={onSaveChanges} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
            <Button variant='ghost' size='sm' onClick={onDiscardChanges} disabled={isSaving}>
              Discard changes
            </Button>
          </>
        ) : (
          <>
            {/* Add record */}
            <Button variant='default' size='sm' onClick={onAddRecord}>
              <Plus className='mr-[4px] h-[12px] w-[12px]' />
              Add record
            </Button>

            {/* Delete selected */}
            {hasSelection && (
              <Button variant='destructive' size='sm' onClick={onDeleteSelected}>
                <Trash2 className='mr-[4px] h-[12px] w-[12px]' />
                Delete {selectedCount} {selectedCount === 1 ? 'record' : 'records'}
              </Button>
            )}
          </>
        )}

        {/* Clear selection */}
        {hasSelection && !hasPendingChanges && (
          <Button variant='ghost' size='sm' onClick={onClearSelection}>
            Clear selection
          </Button>
        )}
      </div>

      {/* Right section: Row count and utilities */}
      <div className='flex items-center gap-[6px]'>
        {isLoading ? (
          <Skeleton className='h-[16px] w-[50px]' />
        ) : (
          <span className='text-[13px] text-[var(--text-tertiary)]'>
            {totalCount} {totalCount === 1 ? 'row' : 'rows'}
          </span>
        )}

        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button variant='ghost' size='sm' onClick={onRefresh} disabled={isLoading}>
              <RefreshCw className='h-[14px] w-[14px]' />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Content>Refresh</Tooltip.Content>
        </Tooltip.Root>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant='ghost' size='sm'>
              <MoreHorizontal className='h-[14px] w-[14px]' />
            </Button>
          </PopoverTrigger>
          <PopoverContent align='end' className='w-[160px]'>
            <PopoverItem onClick={onShowSchema}>View Schema</PopoverItem>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
