// The link contract of the search site (inventory-app M15 C3, ADR 005):
//
//   #/?q=<text>&lang=<code>&site=<slug>&type=<type>&from=<slug>
//
// Every parameter is checked against a closed list before it is used: a slug
// counts only when it is in the package's sites.json, a language only when the
// package has it, a type only when it is one of the searched types. Anything
// else is dropped, never echoed and never followed. No parameter is ever part
// of an address: every link this site writes is a sites.json origin plus a
// route, so nothing a visitor or a referring page puts in the address can send
// someone elsewhere.

export const TYPES = ['object', 'monument', 'detail']
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/
const LANGUAGE = /^[a-z]{2}$/
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

/**
 * The search a route's query asks for, every value checked.
 *
 * @param {Record<string, unknown>} query the router's `route.query`
 * @param {{ sites: Map<string, object>, languages: string[] }} lists
 */
export function parseQuery(query, { sites, languages }) {
  const q = text(query?.q).slice(0, 200)
  const lang = text(query?.lang)
  const site = text(query?.site)
  const type = text(query?.type)
  const from = text(query?.from)
  return {
    q,
    lang: LANGUAGE.test(lang) && languages.includes(lang) ? lang : '',
    site: SLUG.test(site) && sites.has(site) ? site : '',
    type: TYPES.includes(type) ? type : '',
    from: SLUG.test(from) && sites.has(from) ? from : '',
  }
}

/** The query to put back in the address for a search: only what is set. */
export function toQuery(search) {
  const out = {}
  for (const key of ['q', 'lang', 'site', 'type', 'from']) if (search[key]) out[key] = search[key]
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

/** The Meilisearch filter for a search, built only from checked values. */
export function filterOf(search) {
  const filters = []
  if (search.lang) filters.push(`languages = "${search.lang}"`)
  if (search.site) filters.push(`sites.site = "${search.site}"`)
  if (search.type) filters.push(`type = "${search.type}"`)
  return filters
}
