import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { fetchMovieDetails, fetchMovies } from './api/movies'
import type { MovieDetails, MovieSummary } from './api/movies'

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

  const formattedDuration = useMemo(() => {
    if (!selectedDetails) {
      return null
    }

    if (typeof selectedDetails.durationSeconds === 'number') {
      return formatDuration(selectedDetails.durationSeconds)
    }

    if (selectedDetails.rawDuration) {
      return selectedDetails.rawDuration
    }

    return null
  }, [selectedDetails])

  const externalLink = useMemo(() => {
    if (!selectedDetails?.url) {
      return null
    }

    const cleanPath = selectedDetails.url.replace(/^\/+/, '')
    return `https://play.tv2.no/${cleanPath}`
  }, [selectedDetails])

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">TV 2 Play filmoversikt</h1>
        <p className="app__subtitle">
          Bla gjennom filmer direkte fra API-et. Klikk på en film for å hente og vise detaljer.
        </p>
      </header>

      {moviesError && <div className="app__status app__status--error">{moviesError}</div>}

      <section className="movie-grid" aria-live="polite">
        {moviesLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="movie-card movie-card--loading">
                <div className="movie-card__poster movie-card__poster--skeleton" />
                <div className="movie-card__title movie-card__title--skeleton" />
              </div>
            ))
          : movies.map((movie) => (
              <button
                key={movie.id}
                type="button"
                className={`movie-card${activeMovie?.url === movie.url ? ' movie-card--active' : ''}`}
                onClick={() => handleSelectMovie(movie)}
                aria-pressed={activeMovie?.url === movie.url}
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
            ))}
      </section>

      <section className="details" aria-live="polite">
        {detailsLoading && <div className="details__skeleton" aria-hidden="true" />}

        {!detailsLoading && selectedDetails && (
          <>
            {selectedDetails.imageUrl && (
              <img
                src={selectedDetails.imageUrl}
                alt={`Filmplakat for ${selectedDetails.title}`}
                className="details__poster"
              />
            )}
            <div className="details__body">
              <h2 className="details__title">{selectedDetails.title}</h2>

              {detailsError && <div className="app__status app__status--error">{detailsError}</div>}

              <p className="details__description">
                {selectedDetails.description ?? 'Ingen beskrivelse tilgjengelig for denne filmen.'}
              </p>

              <div className="details__meta">
                {formattedDuration && <span>Varighet: {formattedDuration}</span>}
                <span>API-sti: {selectedDetails.url}</span>
              </div>

              {externalLink && (
                <div className="details__actions">
                  <a className="details__link" href={externalLink} target="_blank" rel="noreferrer">
                    Åpne på TV 2 Play
                  </a>
                </div>
              )}
            </div>
          </>
        )}

        {!detailsLoading && !selectedDetails && (
          <div className="details__empty">
            <h2>Velg en film for å se detaljer</h2>
            <p>Vi henter informasjonen direkte fra API-et og viser den her.</p>
          </div>
        )}
      </section>
    </div>
  )
}

function isAbortError(error: unknown): boolean {
  if (!error) {
    return false
  }

  return error instanceof DOMException
    ? error.name === 'AbortError'
    : typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError'
}

function formatDuration(durationSeconds: number): string {
  const totalSeconds = Math.max(0, Math.round(durationSeconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} t`)
  }

  if (minutes > 0) {
    parts.push(`${minutes} min`)
  }

  if (parts.length === 0) {
    parts.push(`${seconds} s`)
  }

  return parts.join(' ')
}

export default App
