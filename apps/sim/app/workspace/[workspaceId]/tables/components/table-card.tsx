'use client'

import { useCallback, useRef, useState } from 'react'
import { createLogger } from '@sim/logger'
import { Columns, Rows3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tooltip,
} from '@/components/emcn'
import type { TableDefinition } from '@/lib/table'
import { useUserPermissionsContext } from '@/app/workspace/[workspaceId]/providers/workspace-permissions-provider'
import { SchemaModal } from '@/app/workspace/[workspaceId]/tables/[tableId]/components/schema-modal'
import { useContextMenu } from '@/app/workspace/[workspaceId]/w/components/sidebar/hooks'
import { useDeleteTable } from '@/hooks/queries/use-tables'
import { formatAbsoluteDate, formatRelativeTime } from '../lib/utils'
import { TableCardContextMenu } from './table-card-context-menu'

const logger = createLogger('TableCard')

interface TableCardProps {
  table: TableDefinition
  workspaceId: string
}

export function TableCard({ table, workspaceId }: TableCardProps) {
  const router = useRouter()
  const userPermissions = useUserPermissionsContext()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPosition,
    menuRef,
    handleContextMenu,
    closeMenu: closeContextMenu,
  } = useContextMenu()

  const handleMenuButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (menuButtonRef.current) {
        const rect = menuButtonRef.current.getBoundingClientRect()
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          clientX: rect.right,
          clientY: rect.bottom,
        } as React.MouseEvent
        handleContextMenu(syntheticEvent)
      }
    },
    [handleContextMenu]
  )

  const deleteTable = useDeleteTable(workspaceId)

  const handleDelete = async () => {
    try {
      await deleteTable.mutateAsync(table.id)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      logger.error('Failed to delete table:', error)
    }
  }

  const navigateToTable = () => {
    router.push(`/workspace/${workspaceId}/tables/${table.id}`)
  }

  const href = `/workspace/${workspaceId}/tables/${table.id}`

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isContextMenuOpen) {
        e.preventDefault()
        return
      }
      navigateToTable()
    },
    [isContextMenuOpen, navigateToTable]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        navigateToTable()
      }
    },
    [navigateToTable]
  )

  const handleOpenInNewTab = useCallback(() => {
    window.open(href, '_blank')
  }, [href])

  const handleViewSchema = useCallback(() => {
    setIsSchemaModalOpen(true)
  }, [])

  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(table.id)
  }, [table.id])

  const handleDeleteFromContextMenu = useCallback(() => {
    setIsDeleteDialogOpen(true)
  }, [])

  const columnCount = table.schema.columns.length
  const shortId = `tb-${table.id.slice(0, 8)}`

  return (
    <>
      <div
        role='button'
        tabIndex={0}
        data-table-card
        className='h-full cursor-pointer'
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
      >
        <div className='group flex h-full flex-col gap-[12px] rounded-[4px] bg-[var(--surface-3)] px-[8px] py-[6px] transition-colors hover:bg-[var(--surface-4)] dark:bg-[var(--surface-4)] dark:hover:bg-[var(--surface-5)]'>
          <div className='flex items-center justify-between gap-[8px]'>
            <h3 className='min-w-0 flex-1 truncate font-medium text-[14px] text-[var(--text-primary)]'>
              {table.name}
            </h3>
            <div className='flex items-center gap-[4px]'>
              <Badge className='flex-shrink-0 rounded-[4px] text-[12px]'>{shortId}</Badge>
              <Button
                ref={menuButtonRef}
                variant='ghost'
                size='sm'
                className='h-[20px] w-[20px] flex-shrink-0 p-0 text-[var(--text-tertiary)]'
                onClick={handleMenuButtonClick}
              >
                <svg className='h-[14px] w-[14px]' viewBox='0 0 16 16' fill='currentColor'>
                  <circle cx='3' cy='8' r='1.5' />
                  <circle cx='8' cy='8' r='1.5' />
                  <circle cx='13' cy='8' r='1.5' />
                </svg>
              </Button>
            </div>
          </div>

          <div className='flex flex-1 flex-col gap-[8px]'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-[12px] text-[12px] text-[var(--text-tertiary)]'>
                <span className='flex items-center gap-[4px]'>
                  <Columns className='h-[12px] w-[12px]' />
                  {columnCount} {columnCount === 1 ? 'col' : 'cols'}
                </span>
                <span className='flex items-center gap-[4px]'>
                  <Rows3 className='h-[12px] w-[12px]' />
                  {table.rowCount} {table.rowCount === 1 ? 'row' : 'rows'}
                </span>
              </div>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <span className='text-[12px] text-[var(--text-tertiary)]'>
                    last updated: {formatRelativeTime(table.updatedAt)}
                  </span>
                </Tooltip.Trigger>
                <Tooltip.Content>{formatAbsoluteDate(table.updatedAt)}</Tooltip.Content>
              </Tooltip.Root>
            </div>

            <div className='h-0 w-full border-[var(--divider)] border-t' />

            <p className='line-clamp-2 h-[36px] text-[12px] text-[var(--text-tertiary)] leading-[18px]'>
              {table.description || 'No description'}
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <ModalContent size='sm'>
          <ModalHeader>Delete Table</ModalHeader>
          <ModalBody>
            <p className='text-[12px] text-[var(--text-secondary)]'>
              Are you sure you want to delete{' '}
              <span className='font-medium text-[var(--text-primary)]'>{table.name}</span>? This
              will permanently delete all {table.rowCount} rows.{' '}
              <span className='text-[var(--text-error)]'>This action cannot be undone.</span>
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant='default'
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteTable.isPending}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete} disabled={deleteTable.isPending}>
              {deleteTable.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Schema Viewer Modal */}
      <SchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        columns={table.schema.columns}
      />

      <TableCardContextMenu
        isOpen={isContextMenuOpen}
        position={contextMenuPosition}
        menuRef={menuRef}
        onClose={closeContextMenu}
        onOpenInNewTab={handleOpenInNewTab}
        onViewSchema={handleViewSchema}
        onCopyId={handleCopyId}
        onDelete={handleDeleteFromContextMenu}
        disableDelete={userPermissions.canEdit !== true}
      />
    </>
  )
}
