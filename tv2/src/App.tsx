import { useEffect, useState } from 'react'
import './App.css'
import { fetchMovies } from './api/movies'
import type { MovieSummary } from './api/movies'
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

function App() {
  const [movies, setMovies] = useState<MovieSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetchMovies(controller.signal)
      .then((fetched) => {
        if (fetched.length === 0) {
          setMovies(FALLBACK_MOVIES)
          setError('Fant ingen filmer i feeden. Viser eksempeldata i stedet.')
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
        setError('Kunne ikke hente filmer fra API-et. Viser eksempeldata i stedet.')
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [])

  return (
    <div className="app">
      <h1 className="app__title">Filmer</h1>

      {isLoading ? (
        <p>Laster filmer …</p>
      ) : (
        <>
          {error && <p className="app__status app__status--error">{error}</p>}
          <ul>
            {movies.map((movie) => (
              <li key={movie.id}>{movie.title}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export default App
