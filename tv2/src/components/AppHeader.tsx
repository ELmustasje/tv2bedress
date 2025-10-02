import type { FC, ReactNode } from 'react'

type AppHeaderProps = {
  title: ReactNode
  subtitle: ReactNode
}

const AppHeader: FC<AppHeaderProps> = ({ title, subtitle }) => (
  <header className="app__header">
    <h1 className="app__title">{title}</h1>
    <p className="app__subtitle">{subtitle}</p>
  </header>
)

export default AppHeader
