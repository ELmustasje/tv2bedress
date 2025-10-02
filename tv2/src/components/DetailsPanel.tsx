import type { FC } from 'react'
import type { MovieDetails } from '../api/movies'
import { formatDuration } from '../utils/formatDuration'
import StatusMessage from './StatusMessage'

type DetailsPanelProps = {
  movie: MovieDetails | null
  isLoading: boolean
  error?: string | null
  playbackHref?: string | null
}

const DetailsPanel: FC<DetailsPanelProps> = ({ movie, isLoading, error, playbackHref }) => {
  const durationLabel = movie?.durationSeconds
    ? formatDuration(movie.durationSeconds)
    : movie?.rawDuration ?? null

  return (
    <section className="details" aria-live="polite">
      {isLoading && <div className="details__skeleton" aria-hidden="true" />}

      {movie && (
        <>
          {movie.imageUrl && (
            <img
              src={movie.imageUrl}
              alt={`Filmplakat for ${movie.title}`}
              className="details__poster"
            />
          )}

          <div className="details__body">
            <h2 className="details__title">{movie.title}</h2>

            {error && (
              <StatusMessage tone="error" role="alert">
                {error}
              </StatusMessage>
            )}

            <p className="details__description">
              {movie.description ?? 'Ingen beskrivelse tilgjengelig for denne filmen.'}
            </p>

            <div className="details__meta">
              {durationLabel && <span>Varighet: {durationLabel}</span>}
              <span>API-sti: {movie.url}</span>
            </div>

            {playbackHref && (
              <div className="details__actions">
                <a className="details__link" href={playbackHref} rel="noreferrer">
                  Åpne i demoen
                </a>
              </div>
            )}
          </div>
        </>
      )}

      {!isLoading && !movie && (
        <div className="details__empty">
          <h2>Velg en film for å se detaljer</h2>
          <p>Vi henter informasjonen direkte fra API-et og viser den her.</p>
        </div>
      )}
    </section>
  )
}

export default DetailsPanel
