'use client'

import { useCallback, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Badge,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/emcn'
import { cn } from '@/lib/core/utils/cn'
import { useContextMenu, useInlineEditing, useRowSelection, useTableData } from '../hooks'
import type { CellViewerData, QueryOptions } from '../lib/types'
import { EmptyRows, LoadingRows } from './body-states'
import { CellViewerModal } from './cell-viewer-modal'
import { ContextMenu } from './context-menu'
import { EditableCell } from './editable-cell'
import { EditableRow } from './editable-row'
import { FilterPanel } from './filter-panel'
import { RowModal } from './row-modal'
import { SchemaModal } from './schema-modal'
import { TableToolbar } from './table-toolbar'

export function TableViewer() {
  const params = useParams()
  const router = useRouter()

  const workspaceId = params.workspaceId as string
  const tableId = params.tableId as string

  const [queryOptions, setQueryOptions] = useState<QueryOptions>({
    filter: null,
    sort: null,
  })
  const [currentPage, setCurrentPage] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [deletingRows, setDeletingRows] = useState<string[]>([])
  const [showSchemaModal, setShowSchemaModal] = useState(false)

  const [cellViewer, setCellViewer] = useState<CellViewerData | null>(null)
  const [copied, setCopied] = useState(false)

  const { tableData, isLoadingTable, rows, totalCount, totalPages, isLoadingRows, refetchRows } =
    useTableData({
      workspaceId,
      tableId,
      queryOptions,
      currentPage,
    })

  const columns = tableData?.schema?.columns || []

  const { selectedRows, handleSelectAll, handleSelectRow, clearSelection } = useRowSelection(rows)

  const { contextMenu, handleRowContextMenu, closeContextMenu } = useContextMenu()

  const {
    newRows,
    pendingChanges,
    addNewRow,
    updateNewRowCell,
    updateExistingRowCell,
    saveChanges,
    discardChanges,
    hasPendingChanges,
    isSaving,
  } = useInlineEditing({
    workspaceId,
    tableId,
    columns,
    onSuccess: refetchRows,
  })

  const selectedCount = selectedRows.size
  const hasSelection = selectedCount > 0
  const isAllSelected = rows.length > 0 && selectedCount === rows.length

  const handleNavigateBack = useCallback(() => {
    router.push(`/workspace/${workspaceId}/tables`)
  }, [router, workspaceId])

  const handleShowSchema = useCallback(() => {
    setShowSchemaModal(true)
  }, [])

  const handleToggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev)
  }, [])

  const handleApplyQueryOptions = useCallback(
    (options: QueryOptions) => {
      setQueryOptions(options)
      setCurrentPage(0)
      refetchRows()
    },
    [refetchRows]
  )

  const handleDeleteSelected = useCallback(() => {
    setDeletingRows(Array.from(selectedRows))
  }, [selectedRows])

  const handleContextMenuEdit = useCallback(() => {
    // For inline editing, we don't need the modal anymore
    // The cell becomes editable on click
    closeContextMenu()
  }, [closeContextMenu])

  const handleContextMenuDelete = useCallback(() => {
    if (contextMenu.row) {
      setDeletingRows([contextMenu.row.id])
    }
    closeContextMenu()
  }, [contextMenu.row, closeContextMenu])

  const handleCopyCellValue = useCallback(async () => {
    if (cellViewer) {
      let text: string
      if (cellViewer.type === 'json') {
        text = JSON.stringify(cellViewer.value, null, 2)
      } else if (cellViewer.type === 'date') {
        text = String(cellViewer.value)
      } else {
        text = String(cellViewer.value)
      }
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [cellViewer])

  const handleCellClick = useCallback(
    (columnName: string, value: unknown, type: CellViewerData['type']) => {
      setCellViewer({ columnName, value, type })
    },
    []
  )

  const handleRemoveNewRow = useCallback(
    (tempId: string) => {
      discardChanges()
    },
    [discardChanges]
  )

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((p) => Math.max(0, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(totalPages - 1, p + 1))
  }, [totalPages])

  if (isLoadingTable) {
    return (
      <div className='flex h-full items-center justify-center'>
        <span className='text-[13px] text-[var(--text-tertiary)]'>Loading table...</span>
      </div>
    )
  }

  if (!tableData) {
    return (
      <div className='flex h-full items-center justify-center'>
        <span className='text-[13px] text-[var(--text-error)]'>Table not found</span>
      </div>
    )
  }

  return (
    <div className='flex h-full flex-col'>
      <TableToolbar
        tableName={tableData.name}
        totalCount={totalCount}
        isLoading={isLoadingRows}
        onNavigateBack={handleNavigateBack}
        onShowSchema={handleShowSchema}
        onRefresh={refetchRows}
        showFilters={showFilters}
        onToggleFilters={handleToggleFilters}
        onAddRecord={addNewRow}
        selectedCount={selectedCount}
        onDeleteSelected={handleDeleteSelected}
        onClearSelection={clearSelection}
        hasPendingChanges={hasPendingChanges}
        onSaveChanges={saveChanges}
        onDiscardChanges={discardChanges}
        isSaving={isSaving}
        currentPage={currentPage}
        totalPages={totalPages}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
      />

      <FilterPanel
        columns={columns}
        isVisible={showFilters}
        onApply={handleApplyQueryOptions}
        onClose={() => setShowFilters(false)}
        isLoading={isLoadingRows}
      />

      <div className='flex-1 overflow-auto'>
        <Table>
          <TableHeader className='sticky top-0 z-10 bg-[var(--surface-3)]'>
            <TableRow>
              <TableHead className='w-[40px]'>
                <Checkbox size='sm' checked={isAllSelected} onCheckedChange={handleSelectAll} />
              </TableHead>
              {columns.map((column) => (
                <TableHead key={column.name}>
                  <div className='flex items-center gap-[6px]'>
                    <span className='text-[12px]'>{column.name}</span>
                    <Badge variant='outline' size='sm'>
                      {column.type}
                    </Badge>
                    {column.required && (
                      <span className='text-[10px] text-[var(--text-error)]'>*</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* New rows being added */}
            {newRows.map((newRow) => (
              <EditableRow
                key={newRow.tempId}
                row={newRow}
                columns={columns}
                onUpdateCell={updateNewRowCell}
                onRemove={handleRemoveNewRow}
              />
            ))}

            {/* Loading state */}
            {isLoadingRows ? (
              <LoadingRows columns={columns} />
            ) : rows.length === 0 && newRows.length === 0 ? (
              <EmptyRows
                columnCount={columns.length}
                hasFilter={!!queryOptions.filter}
                onAddRow={addNewRow}
              />
            ) : (
              /* Existing rows with inline editing */
              rows.map((row) => {
                const rowChanges = pendingChanges.get(row.id)
                const hasChanges = !!rowChanges

                return (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'group hover:bg-[var(--surface-4)]',
                      selectedRows.has(row.id) && 'bg-[var(--surface-5)]',
                      hasChanges && 'bg-amber-500/10'
                    )}
                    onContextMenu={(e) => handleRowContextMenu(e, row)}
                  >
                    <TableCell>
                      <Checkbox
                        size='sm'
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={() => handleSelectRow(row.id)}
                      />
                    </TableCell>
                    {columns.map((column) => {
                      const currentValue = rowChanges?.[column.name] ?? row.data[column.name]

                      return (
                        <TableCell key={column.name}>
                          <EditableCell
                            value={currentValue}
                            column={column}
                            onChange={(value) => updateExistingRowCell(row.id, column.name, value)}
                          />
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation modal */}
      {deletingRows.length > 0 && (
        <RowModal
          mode='delete'
          isOpen={true}
          onClose={() => setDeletingRows([])}
          table={tableData}
          rowIds={deletingRows}
          onSuccess={() => {
            refetchRows()
            setDeletingRows([])
            clearSelection()
          }}
        />
      )}

      <SchemaModal
        isOpen={showSchemaModal}
        onClose={() => setShowSchemaModal(false)}
        columns={columns}
      />

      <CellViewerModal
        cellViewer={cellViewer}
        onClose={() => setCellViewer(null)}
        onCopy={handleCopyCellValue}
        copied={copied}
      />

      <ContextMenu
        contextMenu={contextMenu}
        onClose={closeContextMenu}
        onEdit={handleContextMenuEdit}
        onDelete={handleContextMenuDelete}
      />
    </div>
  )
}
