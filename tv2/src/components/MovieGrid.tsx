import type { FC } from 'react'
import type { MovieSummary } from '../api/movies'
import MovieCard from './MovieCard'
import MovieCardSkeleton from './MovieCardSkeleton'

type MovieGridProps = {
  movies: MovieSummary[]
  isLoading: boolean
  activeMovie: MovieSummary | null
  onSelectMovie: (movie: MovieSummary) => void
}

const MovieGrid: FC<MovieGridProps> = ({ movies, isLoading, activeMovie, onSelectMovie }) => {
  return (
    <section className="movie-grid" aria-live="polite">
      {isLoading
        ? Array.from({ length: 6 }).map((_, index) => <MovieCardSkeleton key={`skeleton-${index}`} />)
        : movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isActive={activeMovie?.url === movie.url}
              onSelect={onSelectMovie}
            />
          ))}
    </section>
  )
}

export default MovieGrid
