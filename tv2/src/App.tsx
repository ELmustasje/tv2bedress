import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { fetchMovieDetails, fetchMovies } from './api/movies'
import type { MovieDetails, MovieSummary } from './api/movies'
import { isAbortError } from './utils/errors'
import AppHeader from './components/AppHeader'
import MovieGrid from './components/MovieGrid'
import DetailsPanel from './components/DetailsPanel'
import StatusMessage from './components/StatusMessage'

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

function App() {
  const [movies, setMovies] = useState<MovieSummary[]>([])
  const [activeMovie, setActiveMovie] = useState<MovieSummary | null>(null)
  const [isLoadingMovies, setIsLoadingMovies] = useState(true)
  const [moviesError, setMoviesError] = useState<string | null>(null)
  const [activeDetails, setActiveDetails] = useState<MovieDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoadingMovies(true)
    setMoviesError(null)

    fetchMovies(controller.signal)
      .then((fetched) => {
        if (fetched.length === 0) {
          setMovies(FALLBACK_MOVIES)
          setMoviesError('Fant ingen filmer i feeden. Viser eksempeldata i stedet.')
          setActiveMovie(FALLBACK_MOVIES[0] ?? null)
          return
        }

        setMovies(fetched)
        setActiveMovie((current) => {
          if (!current) {
            return fetched[0] ?? null
          }

          return (
            fetched.find((movie) => movie.id === current.id || movie.url === current.url) ?? fetched[0] ?? null
          )
        })
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return
        }

        console.error('Kunne ikke hente filmer fra API-et', error)
        setMovies(FALLBACK_MOVIES)
        setMoviesError('Kunne ikke hente filmer fra API-et. Viser eksempeldata i stedet.')
        setActiveMovie(FALLBACK_MOVIES[0] ?? null)
      })
      .finally(() => {
        setIsLoadingMovies(false)
      })

    return () => {
      controller.abort()
    }
  }, [])

  useEffect(() => {
    if (!activeMovie) {
      setActiveDetails(null)
      setDetailsError(null)
      return
    }

    const controller = new AbortController()
    setIsLoadingDetails(true)
    setDetailsError(null)
    setActiveDetails(null)

    fetchMovieDetails(activeMovie.url, controller.signal, activeMovie)
      .then((details) => {
        setActiveDetails(details)
      })
      .catch((error) => {
        if (isAbortError(error)) {
          return
        }

        console.error('Kunne ikke hente detaljer for filmen', error)
        setDetailsError('Kunne ikke hente detaljer for denne filmen akkurat nå. Viser begrenset info i stedet.')
        setActiveDetails({
          ...activeMovie,
          description: 'Vi kunne ikke hente mer informasjon om denne filmen akkurat nå.',
        })
      })
      .finally(() => {
        setIsLoadingDetails(false)
      })

    return () => {
      controller.abort()
    }
  }, [activeMovie])

  const playbackHref = useMemo(() => buildPlaybackHref(activeDetails?.url), [activeDetails?.url])

  return (
    <div className="app">
      <AppHeader
        title={
          <>
            TV 2 Play <span className="app__title-accent">demo</span>
          </>
        }
        subtitle="Utforsk filmlisten som hentes direkte fra TV 2 Play sitt API og se detaljer i sanntid."
      />

      {moviesError && (
        <StatusMessage tone="error" role="alert">
          {moviesError}
        </StatusMessage>
      )}

      <div className="app__content">
        <section className="app__grid-panel">
          <div className="app__section-header">
            <h2 className="app__section-title">Tilgjengelige titler</h2>
            <p className="app__section-description">
              Velg en film for å se detaljer, varighet og API-informasjon.
            </p>
          </div>

          <MovieGrid
            movies={movies}
            isLoading={isLoadingMovies}
            activeMovie={activeMovie}
            onSelectMovie={setActiveMovie}
          />
        </section>

        <DetailsPanel
          movie={activeDetails}
          isLoading={isLoadingDetails}
          error={detailsError}
          playbackHref={playbackHref}
        />
      </div>
    </div>
  )
}

export default App

function buildPlaybackHref(path?: string | null): string | null {
  if (!path) {
    return null
  }

  const cleanPath = path.replace(/^\/+/, '')
  if (!cleanPath) {
    return null
  }

  return `https://ai.play.tv2.no/${cleanPath}`
}
