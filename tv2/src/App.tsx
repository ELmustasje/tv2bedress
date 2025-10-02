import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { fetchMovies } from './api/movies'
import type { MovieSummary } from './api/movies'
import StatusMessage from './components/StatusMessage'
import { isAbortError } from './utils/errors'

type HeroShow = {
  tag: string
  category: string
  title: string
  description: string
  ctaLabel: string
  imageUrl: string
}

type ChannelCard = {
  id: string
  label: string
  description: string
  imageUrl: string
}

type SportEvent = {
  id: string
  label: string
  matchup: string
  time: string
  imageUrl: string
}

type SeriesHighlight = {
  id: string
  rank: number
  title: string
  description: string
  imageUrl: string
}

const FALLBACK_MOVIES: MovieSummary[] = [
  {
    id: 'sample-norges-dummeste',
    title: 'Norges Dummeste',
    url: 'sample/norges-dummeste',
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'sample-jakten-pa-kjarligheten',
    title: 'Jakten på kjærligheten',
    url: 'sample/jakten-pa-kjarligheten',
    imageUrl:
      'https://images.unsplash.com/photo-1495063370686-23d761589a87?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'sample-moc-xyferitime',
    title: 'Mørk dyreflimmer',
    url: 'sample/mork-dyreflimmer',
    imageUrl:
      'https://images.unsplash.com/photo-1468070454955-c5b6932bd08d?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'sample-rosenborg',
    title: 'Rosenborg – Røa',
    url: 'sample/rosenborg-roa',
    imageUrl:
      'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'sample-narvik',
    title: 'Narvik – Sparta',
    url: 'sample/narvik-sparta',
    imageUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80',
  },
  {
    id: 'sample-bloggerne',
    title: 'Bloggerne',
    url: 'sample/bloggerne',
    imageUrl:
      'https://images.unsplash.com/photo-1462396881884-de2c07cb95ed?auto=format&fit=crop&w=1400&q=80',
  },
]

const HERO_DEFAULTS: HeroShow[] = [
  {
    tag: 'Ny episode',
    category: 'Reality',
    title: 'Norges Dummeste',
    description: 'Latterlig eksperiment og det beste fra ukens klipp.',
    ctaLabel: 'Se nå',
    imageUrl:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80',
  },
  {
    tag: 'Ny episode',
    category: 'Romantikk',
    title: 'Jakten på kjærligheten',
    description: 'Speed-datingen fortsetter og bøndene finner sine matcher.',
    ctaLabel: 'Se nå',
    imageUrl:
      'https://images.unsplash.com/photo-1495063370686-23d761589a87?auto=format&fit=crop&w=1400&q=80',
  },
  {
    tag: 'Film',
    category: 'Thriller',
    title: 'Mørk dyreflimmer',
    description: 'Mystikk, spenning og uventede hendelser i skogen.',
    ctaLabel: 'Spill av',
    imageUrl:
      'https://images.unsplash.com/photo-1468070454955-c5b6932bd08d?auto=format&fit=crop&w=1400&q=80',
  },
]

const CHANNELS: ChannelCard[] = [
  {
    id: 'direct',
    label: 'Direkte',
    description: 'Nå: Nyhetsoppdatering',
    imageUrl:
      'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'nyheter',
    label: 'Nyheter',
    description: 'Nå: Toppnyhetene',
    imageUrl:
      'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sport',
    label: 'Sport 1',
    description: 'Nå: Toppserien kvinner',
    imageUrl:
      'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'obos',
    label: 'OBOS-ligaen',
    description: 'Snart: Kvalifiseringsrunde',
    imageUrl:
      'https://images.unsplash.com/photo-1444492696363-332accfd55ec?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'sport2',
    label: 'Sport 2',
    description: 'Nå: NHL Direktesending',
    imageUrl:
      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'zebra',
    label: 'Zebra',
    description: 'Nå: Cops',
    imageUrl:
      'https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=800&q=80',
  },
]

const SPORT_EVENTS_BASE: SportEvent[] = [
  {
    id: 'rbk-rea',
    label: 'I dag 18:00',
    matchup: 'Rosenborg – Røa',
    time: 'Fotball · Kvinner',
    imageUrl:
      'https://images.unsplash.com/photo-1521417531270-9b6821052d7f?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'ful-runde',
    label: 'I dag 19:55',
    matchup: 'Full runde',
    time: 'Håndball · Eliteserien',
    imageUrl:
      'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'rbk-rex',
    label: 'I dag 20:00',
    matchup: 'Rosenborg – Rea',
    time: 'Fotball · Kvinner',
    imageUrl:
      'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'stavanger',
    label: 'I dag 20:10',
    matchup: 'Stavanger Oilers – Vålerenga',
    time: 'Ishockey · Fjordkraft-ligaen',
    imageUrl:
      'https://images.unsplash.com/photo-1513171920216-2640b288471b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'narvik',
    label: 'I dag 19:15',
    matchup: 'Narvik – Sparta',
    time: 'Ishockey · Fjordkraft-ligaen',
    imageUrl:
      'https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?auto=format&fit=crop&w=1200&q=80',
  },
]

const POPULAR_SERIES_BASE: SeriesHighlight[] = [
  {
    id: 'rank-1',
    rank: 1,
    title: 'Norges Dummeste',
    description: '10 på topp nå',
    imageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'rank-2',
    rank: 2,
    title: 'Jakten på kjærligheten',
    description: 'Romantikk',
    imageUrl:
      'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'rank-3',
    rank: 3,
    title: 'Spillet',
    description: 'Drama',
    imageUrl:
      'https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'rank-4',
    rank: 4,
    title: 'Dommeste',
    description: 'Humor',
    imageUrl:
      'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'rank-5',
    rank: 5,
    title: 'Bloggerne',
    description: 'Reality',
    imageUrl:
      'https://images.unsplash.com/photo-1462396881884-de2c07cb95ed?auto=format&fit=crop&w=1200&q=80',
  },
]

const NAV_LINKS = ['Play', 'Sport', 'Film', 'Serier', 'Nyheter', 'Kanaler', 'Barn']

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
          setError('Fant ingen titler i feeden. Viser eksempelinnhold.')
          return
        }

        setMovies(fetched)
      })
      .catch((fetchError) => {
        if (isAbortError(fetchError)) {
          return
        }

        console.error('Kunne ikke hente titler', fetchError)
        setMovies(FALLBACK_MOVIES)
        setError('Kunne ikke hente titler fra API-et. Viser eksempelinnhold i stedet.')
      })
      .finally(() => {
        setIsLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [])

  const heroShows = useMemo(() => {
    const lineup = [...movies, ...FALLBACK_MOVIES]

    return HERO_DEFAULTS.map((show, index) => {
      const movie = lineup[index]
      return {
        ...show,
        title: movie?.title ?? show.title,
        imageUrl: movie?.imageUrl ?? show.imageUrl,
      }
    })
  }, [movies])

  const sportEvents = useMemo(() => {
    const lineup = [...movies.slice(3), ...FALLBACK_MOVIES]

    return SPORT_EVENTS_BASE.map((event, index) => {
      const movie = lineup[index]
      return {
        ...event,
        imageUrl: movie?.imageUrl ?? event.imageUrl,
      }
    })
  }, [movies])

  const popularSeries = useMemo(() => {
    const lineup = [...movies.slice(1), ...FALLBACK_MOVIES]

    return POPULAR_SERIES_BASE.map((series, index) => {
      const movie = lineup[index]
      return {
        ...series,
        title: movie?.title ?? series.title,
        imageUrl: movie?.imageUrl ?? series.imageUrl,
      }
    })
  }, [movies])

  return (
    <div className="app">
      <div className="top-nav">
        <div className="top-nav__inner shell">
          <div className="top-nav__brand">
            <span className="top-nav__logo">TV 2 Play</span>
          </div>

          <nav aria-label="Hovedmeny" className="top-nav__links">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className="top-nav__link">
                {link}
              </a>
            ))}
          </nav>

          <div className="top-nav__actions">
            <button type="button" className="top-nav__action top-nav__action--ghost">
              Logg inn
            </button>
            <button type="button" className="top-nav__action">
              Få tilgang
            </button>
          </div>
        </div>
      </div>

      <main className="app__main">
        <section className="hero shell">
          <header className="hero__header">
            <span className="hero__eyebrow">Ny episode</span>
            <h1 className="hero__title">Alt dette kan du se med TV 2 Play</h1>
            <p className="hero__subtitle">Opplev det beste fra live-kanaler, sport og våre mest populære serier.</p>
          </header>

          <div className="hero__grid">
            {heroShows.map((show, index) => (
              <article
                key={show.title}
                className={`hero-card${index === 0 ? ' hero-card--primary' : ''}`}
                style={{
                  backgroundImage: `linear-gradient(120deg, rgba(8, 11, 25, 0.92) 10%, rgba(8, 11, 25, 0.5) 55%, rgba(8, 11, 25, 0.2) 100%), url(${show.imageUrl})`,
                }}
              >
                <div className="hero-card__content">
                  <div className="hero-card__meta">
                    <span className="chip">{show.tag}</span>
                    <span className="chip chip--ghost">{show.category}</span>
                  </div>
                  <h2 className="hero-card__title">{show.title}</h2>
                  <p className="hero-card__description">{show.description}</p>
                  <div className="hero-card__actions">
                    <button type="button" className="button button--primary">
                      {show.ctaLabel}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {error && (
          <StatusMessage tone="error" role="alert">
            {error}
          </StatusMessage>
        )}

        <section className="section shell">
          <header className="section__header">
            <div>
              <h2 className="section__title">Se TV 2s kanaler direkte</h2>
              <p className="section__subtitle">Direktesendt innhold, akkurat nå.</p>
            </div>
            <button type="button" className="section__cta">
              Se alle
            </button>
          </header>

          <div className="channel-row">
            {CHANNELS.map((channel) => (
              <article
                key={channel.id}
                className="channel-card"
                style={{
                  backgroundImage: `linear-gradient(160deg, rgba(12, 13, 26, 0.95) 10%, rgba(12, 13, 26, 0.75) 60%, rgba(12, 13, 26, 0.5) 100%), url(${channel.imageUrl})`,
                }}
              >
                <span className="chip chip--pill">{channel.label}</span>
                <h3 className="channel-card__title">{channel.description}</h3>
                <p className="channel-card__meta">Direkte</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section shell">
          <header className="section__header">
            <div>
              <h2 className="section__title">Direktesendt sport</h2>
              <p className="section__subtitle">Hold deg oppdatert på ukens kamper og høydepunkter.</p>
            </div>
            <button type="button" className="section__cta">
              Se alle
            </button>
          </header>

          <div className="sport-grid">
            {sportEvents.map((event) => (
              <article
                key={event.id}
                className="sport-card"
                style={{
                  backgroundImage: `linear-gradient(150deg, rgba(10, 12, 24, 0.9) 20%, rgba(10, 12, 24, 0.65) 70%), url(${event.imageUrl})`,
                }}
              >
                <span className="sport-card__label">{event.label}</span>
                <h3 className="sport-card__title">{event.matchup}</h3>
                <p className="sport-card__meta">{event.time}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section shell">
          <header className="section__header">
            <div>
              <h2 className="section__title">Våre mest populære serier</h2>
              <p className="section__subtitle">Se hva som trender på TV 2 Play akkurat nå.</p>
            </div>
          </header>

          <div className="popular-grid">
            {popularSeries.map((series) => (
              <article
                key={series.id}
                className="popular-card"
                style={{
                  backgroundImage: `linear-gradient(160deg, rgba(8, 10, 20, 0.95) 10%, rgba(8, 10, 20, 0.7) 65%), url(${series.imageUrl})`,
                }}
              >
                <span className="popular-card__rank">{series.rank}</span>
                <div className="popular-card__content">
                  <h3 className="popular-card__title">{series.title}</h3>
                  <p className="popular-card__meta">{series.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer shell">
        <p className="footer__text">
          © {new Date().getFullYear()} TV 2 Play · All rights reserved. Innholdet er et demodesign inspirert av TV 2
          Play.
        </p>
      </footer>

      {isLoading && <div className="loading-overlay">Laster innhold …</div>}
    </div>
  )
}

export default App
