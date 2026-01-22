interface ErrorStateProps {
  error: unknown
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className='col-span-full flex h-64 items-center justify-center'>
      <div className='text-[var(--text-error)]'>
        <span className='text-[13px]'>
          Error: {error instanceof Error ? error.message : 'Failed to load tables'}
        </span>
      </div>
    </div>
  )
}
