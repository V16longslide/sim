'use client'

import { useCallback, useMemo, useState } from 'react'
import { ChevronDown, Database, Search } from 'lucide-react'
import { useParams } from 'next/navigation'
import {
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverItem,
  PopoverTrigger,
  Tooltip,
} from '@/components/emcn'
import { useUserPermissionsContext } from '@/app/workspace/[workspaceId]/providers/workspace-permissions-provider'
import { useContextMenu } from '@/app/workspace/[workspaceId]/w/components/sidebar/hooks'
import { useTablesList } from '@/hooks/queries/use-tables'
import { useDebounce } from '@/hooks/use-debounce'
import { filterTables, sortTables } from '../lib/utils'
import { SORT_OPTIONS, type SortOption, type SortOrder } from './constants'
import { CreateModal } from './create-modal'
import { EmptyState } from './empty-state'
import { ErrorState } from './error-state'
import { LoadingState } from './loading-state'
import { TableCard } from './table-card'
import { TableListContextMenu } from './table-list-context-menu'

export function TablesView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const userPermissions = useUserPermissionsContext()

  const { data: tables = [], isLoading, error } = useTablesList(workspaceId)

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SortOption>('updatedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const {
    isOpen: isListContextMenuOpen,
    position: listContextMenuPosition,
    menuRef: listMenuRef,
    handleContextMenu: handleListContextMenu,
    closeMenu: closeListContextMenu,
  } = useContextMenu()

  /**
   * Handle context menu on the content area - only show menu when clicking on empty space
   */
  const handleContentContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      const isOnCard = target.closest('[data-table-card]')
      const isOnInteractive = target.closest('button, input, a, [role="button"]')

      if (!isOnCard && !isOnInteractive) {
        handleListContextMenu(e)
      }
    },
    [handleListContextMenu]
  )

  /**
   * Handle add table from context menu
   */
  const handleAddTable = useCallback(() => {
    setIsCreateModalOpen(true)
  }, [])

  const currentSortValue = `${sortBy}-${sortOrder}`
  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.value === currentSortValue)?.label || 'Last Updated'

  /**
   * Handles sort option change from dropdown
   */
  const handleSortChange = (value: string) => {
    const [field, order] = value.split('-') as [SortOption, SortOrder]
    setSortBy(field)
    setSortOrder(order)
    setIsSortPopoverOpen(false)
  }

  /**
   * Filter and sort tables based on search query and sort options
   */
  const filteredAndSortedTables = useMemo(() => {
    const filtered = filterTables(tables, debouncedSearchQuery)
    return sortTables(filtered, sortBy, sortOrder)
  }, [tables, debouncedSearchQuery, sortBy, sortOrder])

  return (
    <>
      <div className='flex h-full flex-1 flex-col'>
        <div className='flex flex-1 overflow-hidden'>
          <div
            className='flex flex-1 flex-col overflow-auto bg-white px-[24px] pt-[28px] pb-[24px] dark:bg-[var(--bg)]'
            onContextMenu={handleContentContextMenu}
          >
            <div>
              <div className='flex items-start gap-[12px]'>
                <div className='flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-[#64748B] bg-[#F1F5F9] dark:border-[#334155] dark:bg-[#0F172A]'>
                  <Database className='h-[14px] w-[14px] text-[#64748B] dark:text-[#CBD5E1]' />
                </div>
                <h1 className='font-medium text-[18px]'>Tables</h1>
              </div>
              <p className='mt-[10px] text-[14px] text-[var(--text-tertiary)]'>
                Create and manage data tables for your workflows.
              </p>
            </div>

            <div className='mt-[14px] flex items-center justify-between'>
              <div className='flex h-[32px] w-[400px] items-center gap-[6px] rounded-[8px] bg-[var(--surface-4)] px-[8px]'>
                <Search className='h-[14px] w-[14px] text-[var(--text-subtle)]' />
                <Input
                  placeholder='Search'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='flex-1 border-0 bg-transparent px-0 font-medium text-[var(--text-secondary)] text-small leading-none placeholder:text-[var(--text-subtle)] focus-visible:ring-0 focus-visible:ring-offset-0'
                />
              </div>
              <div className='flex items-center gap-[8px]'>
                {tables.length > 0 && (
                  <Popover open={isSortPopoverOpen} onOpenChange={setIsSortPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant='default' className='h-[32px] rounded-[6px]'>
                        {currentSortLabel}
                        <ChevronDown className='ml-2 h-4 w-4 text-muted-foreground' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align='end' side='bottom' sideOffset={4}>
                      <div className='flex flex-col gap-[2px]'>
                        {SORT_OPTIONS.map((option) => (
                          <PopoverItem
                            key={option.value}
                            active={currentSortValue === option.value}
                            onClick={() => handleSortChange(option.value)}
                          >
                            {option.label}
                          </PopoverItem>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Button
                      onClick={() => setIsCreateModalOpen(true)}
                      disabled={userPermissions.canEdit !== true}
                      variant='tertiary'
                      className='h-[32px] rounded-[6px]'
                    >
                      Create
                    </Button>
                  </Tooltip.Trigger>
                  {userPermissions.canEdit !== true && (
                    <Tooltip.Content>Write permission required to create tables</Tooltip.Content>
                  )}
                </Tooltip.Root>
              </div>
            </div>

            <div className='mt-[24px] grid grid-cols-1 gap-[20px] md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {isLoading ? (
                <LoadingState />
              ) : filteredAndSortedTables.length === 0 ? (
                <EmptyState hasSearchQuery={!!debouncedSearchQuery} />
              ) : error ? (
                <ErrorState error={error} />
              ) : (
                filteredAndSortedTables.map((table) => (
                  <TableCard key={table.id} table={table} workspaceId={workspaceId} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <TableListContextMenu
        isOpen={isListContextMenuOpen}
        position={listContextMenuPosition}
        menuRef={listMenuRef}
        onClose={closeListContextMenu}
        onAddTable={handleAddTable}
        disableAdd={userPermissions.canEdit !== true}
      />
    </>
  )
}
