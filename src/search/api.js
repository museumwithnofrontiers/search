import { filterOf } from './contract.js'

// The one request this site makes: a search through the public edge
// (search.metanull.eu), which adds the key itself and answers nothing else.

/** Meilisearch's locales for the legacy language codes the packages use. */
const LOCALES = {
  ar: 'ara', cs: 'ces', de: 'deu', el: 'ell', en: 'eng', es: 'spa', fr: 'fra', he: 'heb', it: 'ita', pt: 'por',
  se: 'swe', tr: 'tur',
}

export const PAGE_SIZE = 20

/**
 * One page of results.
 *
 * @param {string} api the edge's address, no trailing slash
 * @param {{ q: string, lang: string, site: string, type: string }} search checked values (contract.js)
 * @param {number} offset
 * @param {{ fetch?: typeof fetch, signal?: AbortSignal }} [options]
 * @returns {Promise<{ hits: object[], total: number }>}
 */
export async function searchItems(api, search, offset = 0, { fetch: fetchImpl = fetch, signal } = {}) {
  const body = {
    q: search.q,
    offset,
    limit: PAGE_SIZE,
    // Every word must match: with the default, Arabic's article alone matches every record.
    matchingStrategy: 'all',
    filter: filterOf(search),
    ...(search.lang && LOCALES[search.lang] ? { locales: [LOCALES[search.lang]] } : {}),
  }
  const response = await fetchImpl(`${api}/indexes/items/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) throw new Error(`search answered ${response.status}`)
  const result = await response.json()
  return { hits: Array.isArray(result.hits) ? result.hits : [], total: Number(result.estimatedTotalHits ?? 0) }
}

/**
 * What a result shows in the display language: its name there, else in
 * English, else in the first language it has (the platform's rule).
 */
export function inLanguage(hit, language) {
  const texts = hit?.texts ?? {}
  const pick = texts[language]?.name ? language : texts.en?.name ? 'en' : (hit.languages ?? []).find((l) => texts[l]?.name)
  const t = pick ? texts[pick] : null
  return {
    language: pick ?? language,
    name: t?.name ?? '',
    partner: t?.partner?.[0] ?? '',
    dates: t?.dates?.[0] ?? '',
    country: t?.country ?? '',
  }
}
