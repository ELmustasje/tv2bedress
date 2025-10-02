import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMovieDetails, fetchMovies } from '../api/movies'
import type { MovieDetails, MovieSummary } from '../api/movies'
import { isAbortError } from '../utils/errors'

const FALLBACK_MOVIES: MovieSummary[] = [
  // ...same fallback movies as in App.tsx...
]

const FALLBACK_DETAILS: Record<string, MovieDetails> = {
  // ...same fallback details as in App.tsx...
}

export function useMovies() {
  const [movies, setMovies] = useState<MovieSummary[]>([])
  const [moviesLoading, setMoviesLoading] = useState(true)
  const [moviesError, setMoviesError] = useState<string | null>(null)
  const [activeMovie, setActiveMovie] = useState<MovieSummary | null>(null)
  const [selectedDetails, setSelectedDetails] = useState<MovieDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  const detailControllers = useRef<AbortController | null>(null)
  const detailsCache = useRef<Record<string, MovieDetails>>({})

  useEffect(() => {
    const controller = new AbortController()
    setMoviesLoading(true)
    setMoviesError(null)

    fetchMovies(controller.signal)
      .then((fetched) => {
        if (fetched.length === 0) {
          setMovies(FALLBACK_MOVIES)
          setMoviesError('Fant ingen filmer i feeden. Viser eksempeldata i stedet.')
          return
        }
        setMovies(fetched)
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return
        }
        console.error('Kunne ikke hente filmer fra API-et', error)
        setMovies(FALLBACK_MOVIES)
        setMoviesError('Kunne ikke hente filmer fra API-et. Viser eksempeldata i stedet.')
      })
      .finally(() => {
        setMoviesLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [])

  const handleSelectMovie = useCallback(async (movie: MovieSummary) => {
    setActiveMovie(movie)
    setDetailsError(null)

    const cached = detailsCache.current[movie.url]
    if (cached) {
      setSelectedDetails(cached)
      setDetailsLoading(false)
      return
    }

    detailControllers.current?.abort()
    const controller = new AbortController()
    detailControllers.current = controller

    setDetailsLoading(true)
    setSelectedDetails((current) => (current?.url === movie.url ? current : null))

    try {
      const details = await fetchMovieDetails(movie.url, controller.signal, movie)
      detailsCache.current[movie.url] = details
      setSelectedDetails(details)
    } catch (error) {
      if (isAbortError(error)) {
        return
      }
      console.error('Kunne ikke hente detaljer for filmen', error)
      const fallback = FALLBACK_DETAILS[movie.url] ?? {
        ...movie,
        description: 'Ingen detaljer tilgjengelig for denne filmen.',
      }
      detailsCache.current[movie.url] = fallback
      setSelectedDetails(fallback)
      setDetailsError('Kunne ikke hente filmdetaljer fra API-et. Viser tilgjengelig informasjon.')
    } finally {
      setDetailsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (movies.length > 0 && !activeMovie) {
      handleSelectMovie(movies[0])
    }
  }, [movies, activeMovie, handleSelectMovie])

  return {
    movies,
    moviesLoading,
    moviesError,
    activeMovie,
    selectedDetails,
    detailsLoading,
    detailsError,
    handleSelectMovie,
  }
}