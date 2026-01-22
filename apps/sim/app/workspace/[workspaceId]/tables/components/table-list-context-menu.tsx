'use client'

import { Popover, PopoverAnchor, PopoverContent, PopoverItem } from '@/components/emcn'

interface TableListContextMenuProps {
  /**
   * Whether the context menu is open
   */
  isOpen: boolean
  /**
   * Position of the context menu
   */
  position: { x: number; y: number }
  /**
   * Ref for the menu element
   */
  menuRef: React.RefObject<HTMLDivElement | null>
  /**
   * Callback when menu should close
   */
  onClose: () => void
  /**
   * Callback when add table is clicked
   */
  onAddTable?: () => void
  /**
   * Whether the add option is disabled
   * @default false
   */
  disableAdd?: boolean
}

/**
 * Context menu component for the tables list page.
 * Displays "Add table" option when right-clicking on empty space.
 */
export function TableListContextMenu({
  isOpen,
  position,
  menuRef,
  onClose,
  onAddTable,
  disableAdd = false,
}: TableListContextMenuProps) {
  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      variant='secondary'
      size='sm'
    >
      <PopoverAnchor
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: '1px',
          height: '1px',
        }}
      />
      <PopoverContent ref={menuRef} align='start' side='bottom' sideOffset={4}>
        {onAddTable && (
          <PopoverItem
            disabled={disableAdd}
            onClick={() => {
              onAddTable()
              onClose()
            }}
          >
            Add table
          </PopoverItem>
        )}
      </PopoverContent>
    </Popover>
  )
}
