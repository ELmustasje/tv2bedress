import type { FC } from 'react'

const MovieCardSkeleton: FC = () => (
  <div className="movie-card movie-card--loading" aria-hidden="true">
    <div className="movie-card__poster movie-card__poster--skeleton" />
    <div className="movie-card__title movie-card__title--skeleton" />
  </div>
)

export default MovieCardSkeleton
