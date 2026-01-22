import {
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/emcn'
import type { ColumnDefinition } from '@/lib/table'

interface SchemaModalProps {
  isOpen: boolean
  onClose: () => void
  columns: ColumnDefinition[]
}

export function SchemaModal({ isOpen, onClose, columns }: SchemaModalProps) {
  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent size='sm'>
        <ModalHeader>Table Schema</ModalHeader>
        <ModalBody>
          <div className='max-h-[400px] overflow-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[180px]'>Column</TableHead>
                  <TableHead className='w-[100px]'>Type</TableHead>
                  <TableHead>Constraints</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {columns.map((column) => (
                  <TableRow key={column.name}>
                    <TableCell>{column.name}</TableCell>
                    <TableCell>
                      <Badge variant='gray-secondary' size='sm'>
                        {column.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-[6px]'>
                        {column.required && (
                          <Badge variant='gray-secondary' size='sm'>
                            required
                          </Badge>
                        )}
                        {column.unique && (
                          <Badge variant='gray-secondary' size='sm'>
                            unique
                          </Badge>
                        )}
                        {!column.required && !column.unique && (
                          <span className='text-[var(--text-muted)]'>—</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant='default' onClick={() => onClose(false)}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
