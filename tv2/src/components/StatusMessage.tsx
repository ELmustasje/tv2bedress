import type { FC, ReactNode } from 'react'

type StatusTone = 'default' | 'error'

type StatusMessageProps = {
  tone?: StatusTone
  children: ReactNode
  role?: 'status' | 'alert'
}

const StatusMessage: FC<StatusMessageProps> = ({ tone = 'default', children, role }) => {
  const className = `app__status${tone === 'error' ? ' app__status--error' : ''}`

  return (
    <div className={className} role={role}>
      {children}
    </div>
  )
}

export default StatusMessage
