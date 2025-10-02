import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { fetchMovieDetails, fetchMovies } from './api/movies'
import type { MovieDetails, MovieSummary } from './api/movies'
import AppHeader from './components/AppHeader'
import DetailsPanel from './components/DetailsPanel'
import MovieGrid from './components/MovieGrid'
import StatusMessage from './components/StatusMessage'
import { isAbortError } from './utils/errors'

const FALLBACK_MOVIES: MovieSummary[] = [
  {
    id: 'sample-nordlysjakten',
    title: 'Nordlysjakten',
    url: 'sample/nordlysjakten',
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-sommerbris',
    title: 'Sommerbris',
    url: 'sample/sommerbris',
    imageUrl:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-midnattsløp',
    title: 'Midnattsløpet',
    url: 'sample/midnattslopet',
    imageUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
  },
]

const FALLBACK_DETAILS: Record<string, MovieDetails> = {
  'sample/nordlysjakten': {
    ...FALLBACK_MOVIES[0],
    description:
      'Et reisefølge med eventyrlystne venner drar nordover for å filme nordlyset, men møter krefter de aldri hadde forventet.',
    durationSeconds: 5400,
  },
  'sample/sommerbris': {
    ...FALLBACK_MOVIES[1],
    description:
      'En varm feelgood-historie om et lite kystsamfunn som samles for å arrangere sommerens store musikkfestival.',
    durationSeconds: 5820,
  },
  'sample/midnattslopet': {
    ...FALLBACK_MOVIES[2],
    description:
      'En thrillende katt-og-mus-jakt gjennom Oslos bakgater der en nyutdannet journalist avslører en korrupsjonsskandale.',
    durationSeconds: 6240,
  },
}

function App() {
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

  const playbackHref = useMemo(() => {
    if (!selectedDetails?.url) {
      return null
    }

    const cleanPath = selectedDetails.url.replace(/^\/+/, '')
    return `/play/${cleanPath}`
  }, [selectedDetails])

  return (
    <div className="app">
      <AppHeader
        title="TV 2 Play filmoversikt"
        subtitle="Bla gjennom filmer direkte fra API-et. Klikk på en film for å hente og vise detaljer."
      />

      {moviesError && (
        <StatusMessage tone="error" role="alert">
          {moviesError}
        </StatusMessage>
      )}

      <MovieGrid
        movies={movies}
        isLoading={moviesLoading}
        activeMovie={activeMovie}
        onSelectMovie={handleSelectMovie}
      />

      <DetailsPanel
        movie={selectedDetails}
        isLoading={detailsLoading}
        error={detailsError}
        playbackHref={playbackHref}
      />
    </div>
  )
}

export default App
