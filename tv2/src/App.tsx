import { useMemo } from 'react'
import './App.css'
import AppHeader from './components/AppHeader'
import DetailsPanel from './components/DetailsPanel'
import MovieGrid from './components/MovieGrid'
import StatusMessage from './components/StatusMessage'
import { useMovies } from './hooks/useMovies'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  const {
    movies,
    moviesLoading,
    moviesError,
    activeMovie,
    selectedDetails,
    detailsLoading,
    detailsError,
    handleSelectMovie,
  } = useMovies()

  const playbackHref = useMemo(() => {
    if (!selectedDetails?.url) {
      return null
    }
    const cleanPath = selectedDetails.url.replace(/^\/+/, '')
    return `/play/${cleanPath}`
  }, [selectedDetails])

  return (
    <BrowserRouter>
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

        <Routes>
          <Route
            path="/"
            element={
              <MovieGrid
                movies={movies}
                isLoading={moviesLoading}
                activeMovie={activeMovie}
                onSelectMovie={handleSelectMovie}
              />
            }
          />
          <Route
            path="/movie/:id"
            element={
              <DetailsPanel
                movie={selectedDetails}
                isLoading={detailsLoading}
                error={detailsError}
                playbackHref={playbackHref}
              />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
