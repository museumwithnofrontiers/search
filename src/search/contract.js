// The link contract of the search site (inventory-app M15 C3, ADR 005):
//
//   #/?q=<text>&in=<field>&since=<year>&until=<year>&searchlang=<code>&site=<slug>&type=<type>&from=<slug>
//
// `lang` is not part of it: on every site it is the display language, which
// viewer-core keeps in the address and the search box of a site sends along.
// The language the results must be in is `searchlang`.
//
// Every parameter is checked against a closed list before it is used: a slug
// counts only when it is in the package's sites.json, a language only when the
// package has it, a type only when it is one of the searched types, a field
// only when it is one of FIELDS, a year only when it is a whole number. Anything
// else is dropped, never echoed and never followed. No parameter is ever part
// of an address: every link this site writes is a sites.json origin plus a
// route, so nothing a visitor or a referring page puts in the address can send
// someone elsewhere.

export const TYPES = ['object', 'monument', 'detail']

/**
 * The fields a search can be limited to: legacy's database search form
 * (database_searchform.php), with Location and Provenance as one choice, and
 * Architect/Artist/Master and Patron as another, as the documents hold them.
 * Each lists its `texts.<language>.` fields; `tags` is the untranslated one.
 */
export const FIELDS = {
  name: { texts: ['name', 'names'] },
  keyword: { texts: ['keywords', 'tags'], plain: ['tags'] },
  place: { texts: ['place'] },
  dynasty: { texts: ['dynasty'] },
  artist: { texts: ['artist'] },
  material: { texts: ['materials'] },
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const LANGUAGE = /^[a-z]{2}$/
const YEAR = /^-?\d{1,6}$/
const ORIGIN = /^https:\/\/[^/?#@\s]+(\/[^/?#\s]+)*$/
const ROUTE = /^\/[^\s]*$/

/** The sites of sites.json by slug, keeping only well-formed entries. */
export function siteIndex(sitesFile) {
  const index = new Map()
  for (const site of Array.isArray(sitesFile?.sites) ? sitesFile.sites : []) {
    if (typeof site?.slug !== 'string' || !SLUG.test(site.slug)) continue
    if (typeof site.origin !== 'string' || !ORIGIN.test(site.origin)) continue
    index.set(site.slug, site)
  }
  return index
}

const first = (value) => (Array.isArray(value) ? value[0] : value)
const text = (value) => (typeof first(value) === 'string' ? first(value) : '')
/** A whole year as text ('' when it is not one), without a leading zero or a minus zero. */
const year = (value) => {
  const v = text(value).trim()
  return YEAR.test(v) ? String(Number(v) || 0) : ''
}

/**
 * The search a route's query asks for, every value checked.
 *
 * @param {Record<string, unknown>} query the router's `route.query`
 * @param {{ sites: Map<string, object>, languages: string[] }} lists
 */
export function parseQuery(query, { sites, languages }) {
  const q = text(query?.q).slice(0, 200)
  const field = text(query?.in)
  const searchlang = text(query?.searchlang)
  const site = text(query?.site)
  const type = text(query?.type)
  const from = text(query?.from)
  let since = year(query?.since)
  let until = year(query?.until)
  // A range given backwards is read the right way round.
  if (since && until && Number(since) > Number(until)) [since, until] = [until, since]
  return {
    q,
    in: Object.hasOwn(FIELDS, field) ? field : '',
    since,
    until,
    searchlang: LANGUAGE.test(searchlang) && languages.includes(searchlang) ? searchlang : '',
    site: SLUG.test(site) && sites.has(site) ? site : '',
    type: TYPES.includes(type) ? type : '',
    from: SLUG.test(from) && sites.has(from) ? from : '',
  }
}

const KEYS = ['q', 'in', 'since', 'until', 'searchlang', 'site', 'type', 'from']

/** The query to put back in the address for a search: only what is set. */
export function toQuery(search) {
  const out = {}
  for (const key of KEYS) if (search[key]) out[key] = search[key]
  return out
}

/**
 * The address of a route on a site of sites.json; null for an unknown slug or
 * a route that is not one. The page is `<origin>/#<route>`, as every site's.
 */
export function siteUrl(sites, slug, route) {
  const site = sites.get(slug)
  if (!site || typeof route !== 'string' || !ROUTE.test(route) || route.startsWith('//')) return null
  return `${site.origin}/#${route}`
}

/**
 * The Meilisearch filter for a search, built only from checked values.
 *
 * The years keep legacy's rule (islamicart's database_results.php): an item
 * counts when its dates meet the range, `coalesce(end, start) >= since` and
 * `start <= until`. An item without dates is left out once a year is given.
 */
export function filterOf(search) {
  const filters = []
  if (search.searchlang) filters.push(`languages = "${search.searchlang}"`)
  if (search.site) filters.push(`sites.site = "${search.site}"`)
  if (search.type) filters.push(`type = "${search.type}"`)
  if (search.since) filters.push(`(end_date >= ${search.since} OR (end_date IS NULL AND start_date >= ${search.since}))`)
  if (search.until) filters.push(`start_date <= ${search.until}`)
  return filters
}

/**
 * The attributes a search limited to one field searches, in every language
 * of the package; null searches every searchable attribute.
 *
 * @param {string} field a key of FIELDS, or ''
 * @param {string[]} languages the package's languages
 */
export function attributesOf(field, languages) {
  const spec = Object.hasOwn(FIELDS, field) ? FIELDS[field] : null
  if (!spec) return null
  return [...languages.flatMap((l) => spec.texts.map((f) => `texts.${l}.${f}`)), ...(spec.plain ?? [])]
}
