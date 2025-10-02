import type { FC } from 'react'
import type { MovieSummary } from '../api/movies'

type MovieCardProps = {
  movie: MovieSummary
  isActive: boolean
  onSelect: (movie: MovieSummary) => void
}

const MovieCard: FC<MovieCardProps> = ({ movie, isActive, onSelect }) => {
  return (
    <button
      type="button"
      className={`movie-card${isActive ? ' movie-card--active' : ''}`}
      onClick={() => onSelect(movie)}
      aria-pressed={isActive}
    >
      {movie.imageUrl ? (
        <img
          src={movie.imageUrl}
          alt={`Filmplakat for ${movie.title}`}
          className="movie-card__poster"
          loading="lazy"
        />
      ) : (
        <div className="movie-card__poster movie-card__poster--empty">Ingen plakat</div>
      )}
      <h3 className="movie-card__title">{movie.title}</h3>
    </button>
  )
}

export default MovieCard
