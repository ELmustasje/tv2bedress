# TV 2 Play Developer Recruitment Task - API Guide

Denne README-filen forklarer hvordan du kan gjøre enkle GET-requests for å hente data som trengs i oppgaven.

## Oppgaven

Du skal lage en film-app med to views:
1. **Front page** - Liste over filmer
2. **Detail page** - Detaljert visning av en film (valgfri)

## API Endpoints

### 1. Hente liste over filmer (View 1)

```javascript
// Hent film-samling for front page
async function getMovies() {
  try {
    const response = await fetch('https://ai.play.tv2.no/v4/feeds/page_01jwxh2p1me02sbhyxmht24cbp');
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Feil ved henting av filmer:', error);
  }
}
```

### 2. Hente spesifikk film (View 2)

```javascript
// Hent detaljert informasjon om en film
async function getMovieDetails(movieUrl) {
  try {
    const response = await fetch(`https://ai.play.tv2.no/v4/content/path/${movieUrl}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Feil ved henting av filmdetaljer:', error);
  }
}
```

### 3. Hente filmplakater

```javascript
// Hent filmplakat med riktig størrelse
function getMoviePoster(imageUrl, width = 300, height = 450) {
  // Bytt ut location=list med location=moviePoster
  const posterUrl = imageUrl.replace('location=list', 'location=moviePoster');
  return `${posterUrl}&width=${width}&height=${height}`;
}
```

## Data-struktur

### Film-liste (View 1)
Hver film i listen skal inneholde:
- **Thumbnail** - Bilde av filmen
- **Title** - Tittel på filmen
- **url** - URL for å hente detaljert informasjon

### Film-detaljer (View 2)
Detaljsiden skal vise:
- **Image** - Stort bilde med play-ikon
- **Title** - Tittel på filmen
- **Description** - Beskrivelse av filmen
- **Duration** - Varighet på filmen

## Eksempel med axios (hvis du foretrekker det)

```javascript
// Installer axios: npm install axios
import axios from 'axios';

// Hent film-liste
const getMovies = async () => {
  try {
    const response = await axios.get('https://ai.play.tv2.no/v4/feeds/page_01jwxh2p1me02sbhyxmht24cbp');
    return response.data;
  } catch (error) {
    console.error('Feil ved henting av filmer:', error);
  }
};

// Hent film-detaljer
const getMovieDetails = async (movieUrl) => {
  try {
    const response = await axios.get(`https://ai.play.tv2.no/v4/content/path/${movieUrl}`);
    return response.data;
  } catch (error) {
    console.error('Feil ved henting av filmdetaljer:', error);
  }
};
```

## API-endpoints for oppgaven

| Endpoint | Beskrivelse | Bruk |
|----------|-------------|------|
| `https://ai.play.tv2.no/v4/feeds/page_01jwxh2p1me02sbhyxmht24cbp` | Hent film-samling | View 1 - Front page |
| `https://ai.play.tv2.no/v4/content/path/{movieUrl}` | Hent film-detaljer | View 2 - Detail page |

## Feilhåndtering

```javascript
async function safeApiCall(url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API-kall feilet:', error);
    return null;
  }
}
```

## CORS og Proxy-oppsett

### Problem med CORS
Når du kjører appen lokalt (f.eks. `localhost:3000`), kan du få CORS-feil når du prøver å hente data fra TV 2 Play API. Dette er fordi nettleseren blokkerer forespørsler mellom forskjellige domener.

### Løsning 1: Proxy med Vite (anbefalt)

Hvis du bruker Vite, legg til proxy i `vite.config.js`:

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://ai.play.tv2.no',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

Deretter kan du bruke relative URLer i koden:

```javascript
// I stedet for: https://ai.play.tv2.no/v4/feeds/page_01jwxh2p1me02sbhyxmht24cbp
// Bruk: /api/v4/feeds/page_01jwxh2p1me02sbhyxmht24cbp

async function getMovies() {
  try {
    const response = await fetch('/api/v4/feeds/page_01jwxh2p1me02sbhyxmht24cbp');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Feil ved henting av filmer:', error);
  }
}
```

### Løsning 2: Proxy med Create React App

Hvis du bruker Create React App, legg til i `package.json`:

```json
{
  "name": "movie-app",
  "version": "0.1.0",
  "private": true,
  "proxy": "https://ai.play.tv2.no",
  "dependencies": {
    // ... andre dependencies
  }
}
```

### Løsning 3: CORS-proxy tjeneste

Du kan også bruke en tredjeparts CORS-proxy:

```javascript
// Bruk en CORS-proxy tjeneste
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const API_URL = 'https://ai.play.tv2.no/v4/feeds/page_01jwxh2p1me02sbhyxmht24cbp';

async function getMovies() {
  try {
    const response = await fetch(`${CORS_PROXY}${API_URL}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Feil ved henting av filmer:', error);
  }
}
```

### Løsning 4: Backend-proxy

Lag en enkel backend-server som fungerer som proxy:

```javascript
// server.js (Node.js/Express)
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors());

app.use('/api', createProxyMiddleware({
  target: 'https://ai.play.tv2.no',
  changeOrigin: true,
  pathRewrite: {
    '^/api': ''
  }
}));

app.listen(3001, () => {
  console.log('Proxy server running on port 3001');
});
```

### Headers (hvis nødvendig)

Hvis du fortsatt får problemer, kan du prøve å legge til headers:

```javascript
const response = await fetch('https://ai.play.tv2.no/v4/feeds/page_01jwxh2p1me02sbhyxmht24cbp', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Origin': 'http://localhost:3000'
  }
});
```

## Eksempel på komplett komponenter

### View 1: Film-liste (Front page)

```javascript
// React komponent for film-liste
import React, { useState, useEffect } from 'react';

function MovieList() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const response = await fetch('https://ai.play.tv2.no/v4/feeds/page_01jwxh2p1me02sbhyxmht24cbp');
        const data = await response.json();
        setMovies(data.items || data);
      } catch (error) {
        console.error('Feil ved henting av filmer:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, []);

  if (loading) return <div>Laster filmer...</div>;

  return (
    <div className="movie-list">
      <h2>Filmer</h2>
      <div className="movies-grid">
        {movies.map(movie => (
          <div key={movie.id} className="movie-card" onClick={() => navigateToMovie(movie.url)}>
            <img 
              src={getMoviePoster(movie.image_url)} 
              alt={movie.title}
              className="movie-thumbnail"
            />
            <h3 className="movie-title">{movie.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}

// Hjelpefunksjon for å navigere til film-detaljer
function navigateToMovie(movieUrl) {
  // Implementer navigasjon til detail page
  window.location.href = `/movie/${movieUrl}`;
}

// Hjelpefunksjon for filmplakater
function getMoviePoster(imageUrl, width = 300, height = 450) {
  const posterUrl = imageUrl.replace('location=list', 'location=moviePoster');
  return `${posterUrl}&width=${width}&height=${height}`;
}

export default MovieList;
```

### View 2: Film-detaljer (Detail page)

```javascript
// React komponent for film-detaljer
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function MovieDetail() {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const { movieUrl } = useParams();

  useEffect(() => {
    async function fetchMovieDetails() {
      try {
        const response = await fetch(`https://ai.play.tv2.no/v4/content/path/${movieUrl}`);
        const data = await response.json();
        setMovie(data);
      } catch (error) {
        console.error('Feil ved henting av filmdetaljer:', error);
      } finally {
        setLoading(false);
      }
    }

    if (movieUrl) {
      fetchMovieDetails();
    }
  }, [movieUrl]);

  if (loading) return <div>Laster filmdetaljer...</div>;
  if (!movie) return <div>Film ikke funnet</div>;

  return (
    <div className="movie-detail">
      <div className="movie-poster-container">
        <img 
          src={getMoviePoster(movie.image_url, 400, 600)} 
          alt={movie.title}
          className="movie-poster"
        />
        <div className="play-icon">▶</div>
      </div>
      <div className="movie-info">
        <h1 className="movie-title">{movie.title}</h1>
        <p className="movie-description">{movie.description}</p>
        <p className="movie-duration">Varighet: {movie.duration}</p>
      </div>
    </div>
  );
}

export default MovieDetail;
```

## Inspirasjon

Se på eksisterende TV 2 Play for inspirasjon:
- [Film-samling på web](https://play.tv2.no/leiefilm)

## Tips for oppgaven

1. **Bruk try-catch** for alle API-kall
2. **Håndter loading states** for bedre brukeropplevelse
3. **Valider data** før du bruker den
4. **Filmplakater**: Bytt `location=list` med `location=moviePoster` for bedre bilder
5. **Navigasjon**: Bruk `movie.url` for å navigere til detaljsiden
6. **Responsivt design**: Tenk på mobil og desktop

## Neste steg

1. **Test API-endpoints** med Postman eller browser
2. **Implementer View 1** - Film-liste med thumbnail og tittel
3. **Implementer View 2** - Film-detaljer (valgfri)
4. **Legg til navigasjon** mellom views
5. **Styling** - Gjør det pent og brukervennlig

## Viktige punkter

- Dette er **ikke** ment som en produksjonsklar app
- Fokuser på **1-2 views** og få en fungerende POC
- **Velg** enten View 1, View 2, eller begge
- **Inspirert** av TV 2 Play, men du kan gå din egen vei design-messig

---

**Merk:** Dette er de faktiske API-endpoints og kravene fra oppgaven. Fokuser på å få en fungerende løsning fremfor perfekt kode.

README.md
Viser README.md.