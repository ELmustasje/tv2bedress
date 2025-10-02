const MOVIES_FEED_PATH = '/api/v4/feeds/page_01jwxh2p1me02sbhyxmht24cbp'
const MOVIE_DETAILS_PATH = '/api/v4/content/path/'

export interface MovieSummary {
  id: string
  title: string
  url: string
  imageUrl?: string
}

export interface MovieDetails extends MovieSummary {
  description?: string
  durationSeconds?: number
  rawDuration?: string
}

export async function fetchMovies(signal?: AbortSignal): Promise<MovieSummary[]> {
  const response = await fetch(MOVIES_FEED_PATH, { signal })
  console.log(response);


  if (!response.ok) {
    throw new Error(`Kunne ikke hente filmfeed (status ${response.status})`)
  }

  const data = await response.json()
  const items = extractItems(data)
    .map((item) => toMovieSummary(item))
    .filter((movie): movie is MovieSummary => movie !== null)

  if (items.length === 0) {
    throw new Error('Filmfeed returnerte ingen filmer')
  }

  return items
}

export async function fetchMovieDetails(
  moviePath: string,
  signal?: AbortSignal,
  fallback?: MovieSummary,
): Promise<MovieDetails> {
  const normalisedPath = normalisePath(moviePath)
  const response = await fetch(`${MOVIE_DETAILS_PATH}${normalisedPath}`, { signal })

  if (!response.ok) {
    throw new Error(`Kunne ikke hente detaljer for "${moviePath}" (status ${response.status})`)
  }

  const data = await response.json()
  return normaliseMovieDetails(data, fallback)
}

type UnknownRecord = Record<string, unknown>

function extractItems(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;

  const record = asRecord(data);
  if (!record) return [];

  const feedRecord = asRecord(record.feed);
  const pageRecord = asRecord(record.page);
  const responseRecord = asRecord(record.response);

  // NEW: direct 'content' on the root
  const directContent = readArray(record.content);
  if (directContent) return directContent;

  const candidates = [
    readArray(record.items),
    readArray(feedRecord?.items),
    readArray(asRecord(feedRecord?.data)?.items),
    readArray(pageRecord?.items),
    readArray(asRecord(pageRecord?.content)?.items),
    readArray(responseRecord?.items),
  ];

  for (const candidate of candidates) {
    if (candidate) return candidate;
  }

  // NEW: feeds[].content or feeds[].items
  const feedsArr = readArray(record.feeds);
  if (feedsArr) {
    for (const f of feedsArr) {
      const fRec = asRecord(f);
      if (!fRec) continue;
      const feedContent = readArray(fRec.content);
      if (feedContent) return feedContent;
      const feedItems = readArray(fRec.items);
      if (feedItems) return feedItems;
    }
  }

  const sections = readArray(record.sections) ?? readArray(feedRecord?.sections) ?? [];
  for (const section of sections) {
    const sectionRecord = asRecord(section);
    if (!sectionRecord) continue;
    const items = readArray(sectionRecord.items);
    if (items) return items;
  }

  return [];
}

function toMovieSummary(item: unknown): MovieSummary | null {
  const itemRecord = asRecord(item);
  if (!itemRecord) return null;

  const content =
    asRecord(itemRecord.content) ??
    asRecord(itemRecord.program) ??
    asRecord(itemRecord.asset) ??
    asRecord(itemRecord.target) ??
    asRecord(itemRecord.item) ??
    itemRecord;

  const title =
    getString(content, 'title') ??
    getString(content, 'name') ??
    getString(itemRecord, 'title') ??
    getString(itemRecord, 'name');

  const urlCandidate =
    getString(content, 'url') ??
    getString(content, 'path') ??
    getString(content, 'productPath') ??
    getString(itemRecord, 'url') ??
    getString(itemRecord, 'path');

  if (!title || !urlCandidate) return null;

  const idCandidate =
    getString(content, 'id') ??
    getString(itemRecord, 'id') ??
    getString(content, 'contentId') ??
    getString(content, 'programId') ??
    getString(content, 'uuid') ??
    getString(content, 'slug') ??
    urlCandidate;

  // NEW: allow image.src
  const posterCandidate =
    getString(content, 'imageUrl') ??
    getString(content, 'image_url') ??
    readString(getProp(asRecord(getProp(content, 'image')), 'url')) ??
    readString(getProp(asRecord(getProp(content, 'image')), 'src')) ??   // 👈 add this
    readImageFromImages(getProp(content, 'images')) ??
    readString(getProp(asRecord(getProp(itemRecord, 'image')), 'url')) ??
    readString(getProp(asRecord(getProp(itemRecord, 'image')), 'src')) ?? // 👈 and this
    getString(itemRecord, 'imageUrl') ??
    getString(itemRecord, 'image_url');

  return {
    id: idCandidate && idCandidate.length > 0 ? idCandidate : normalisePath(urlCandidate),
    title,
    url: normalisePath(urlCandidate),
    imageUrl: ensurePoster(posterCandidate),
  };
}

function normaliseMovieDetails(data: unknown, fallback?: MovieSummary): MovieDetails {
  const record = asRecord(data)
  const summary = toMovieSummary(data) ?? fallback ?? null

  const title = summary?.title ?? getString(record, 'title') ?? fallback?.title
  const url = summary?.url ?? normalisePath(getString(record, 'url') ?? getString(record, 'path'))

  const description =
    getString(record, 'description') ??
    getString(record, 'synopsis') ??
    getString(record, 'summary') ??
    getString(record, 'longDescription') ??
    getString(record, 'body') ??
    (fallback && 'description' in fallback ? (fallback as MovieDetails).description : undefined)

  const posterCandidate =
    readString(getProp(asRecord(getProp(record, 'image')), 'url')) ??
    readString(getProp(asRecord(getProp(record, 'image')), 'src')) ??  // 👈 add
    getString(record, 'imageUrl') ??
    getString(record, 'image_url') ??
    readImageFromImages(getProp(record, 'images')) ??
    summary?.imageUrl;

  const durationSeconds = parseDurationToSeconds(
    getProp(record, 'duration') ??
    getProp(record, 'durationInSeconds') ??
    getProp(record, 'runtime') ??
    getProp(record, 'contentDuration') ??
    getProp(record, 'durationSeconds'),
  )

  const idCandidate =
    getString(record, 'id') ??
    getString(record, 'contentId') ??
    summary?.id ??
    url

  const imageUrl = ensurePoster(posterCandidate ?? summary?.imageUrl)

  return {
    id: idCandidate && idCandidate.length > 0 ? idCandidate : summary?.id ?? url,
    title: title ?? 'Ukjent film',
    url,
    imageUrl,
    description,
    durationSeconds,
    rawDuration: readString(getProp(record, 'duration')),
  }
}

function normalisePath(input?: string): string {
  if (!input) {
    return ''
  }

  let working = input.trim()

  try {
    const parsed = new URL(working, 'https://ai.play.tv2.no')
    working = parsed.pathname || working
  } catch {
    // Ignore invalid URL errors and keep the original string
  }

  working = working.replace(/^\/+/u, '')

  return working
}

function ensurePoster(url?: string): string | undefined {
  if (!url) {
    return undefined
  }

  if (url.includes('location=list')) {
    return url.replace('location=list', 'location=moviePoster')
  }

  return url
}

function parseDurationToSeconds(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value)
  }

  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()

  if (trimmed.length === 0) {
    return undefined
  }

  const numeric = Number(trimmed)
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return Math.round(numeric)
  }

  const isoMatch = /^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)$/i.exec(trimmed)
  if (isoMatch) {
    const hours = isoMatch[1] ? Number(isoMatch[1]) : 0
    const minutes = isoMatch[2] ? Number(isoMatch[2]) : 0
    const seconds = isoMatch[3] ? Number(isoMatch[3]) : 0
    return hours * 3600 + minutes * 60 + seconds
  }

  const timeMatch = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/u.exec(trimmed)
  if (timeMatch) {
    if (timeMatch[3]) {
      const hours = Number(timeMatch[1])
      const minutes = Number(timeMatch[2])
      const seconds = Number(timeMatch[3])
      return hours * 3600 + minutes * 60 + seconds
    }

    const minutes = Number(timeMatch[1])
    const seconds = Number(timeMatch[2])
    return minutes * 60 + seconds
  }

  return undefined
}

function asRecord(value: unknown): UnknownRecord | undefined {
  if (typeof value === 'object' && value !== null) {
    return value as UnknownRecord
  }

  return undefined
}

function readArray(value: unknown): unknown[] | undefined {
  return Array.isArray(value) ? value : undefined
}

function getProp<T = unknown>(record: UnknownRecord | undefined, key: string): T | undefined {
  if (!record) {
    return undefined
  }

  if (Object.prototype.hasOwnProperty.call(record, key)) {
    return record[key] as T
  }

  return undefined
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getString(record: UnknownRecord | undefined, key: string): string | undefined {
  return readString(getProp(record, key))
}

function readImageFromImages(value: unknown): string | undefined {
  const direct = readImageFromValue(value)
  if (direct) {
    return direct
  }

  const record = asRecord(value)
  if (!record) {
    return undefined
  }

  const keys = ['poster', 'portrait', 'list', 'default', 'landscape']

  for (const key of keys) {
    const candidate = readImageFromCollection(record[key])
    if (candidate) {
      return candidate
    }
  }

  return readImageFromCollection(value)
}

function readImageFromCollection(value: unknown): string | undefined {
  const array = readArray(value)
  if (!array) {
    return undefined
  }

  for (const entry of array) {
    const candidate = readImageFromValue(entry)
    if (candidate) {
      return candidate
    }
  }

  return undefined
}

function readImageFromValue(value: unknown): string | undefined {
  if (!value) {
    return undefined
  }

  if (typeof value === 'string') {
    return value
  }

  const record = asRecord(value)
  if (!record) {
    return undefined
  }

  return getString(record, 'url') ?? getString(record, 'href')
}
