import { describe, expect, it, vi } from 'vitest'
import { filterOf, parseQuery, siteIndex, siteUrl, toQuery } from '../src/search/contract.js'
import { inLanguage, searchItems } from '../src/search/api.js'

const sites = siteIndex({
  schema: 'mwnf.search/1',
  sites: [
    { slug: 'islamicart', name: 'Discover Islamic Art', kind: 'standalone', origin: 'https://museumwithnofrontiers.github.io/islamicart', item_path: '/item/:id' },
    { slug: 'ceramics', name: 'Ceramics', kind: 'gallery', origin: 'https://museumwithnofrontiers.github.io/ceramics', item_path: '/item/:id' },
    { slug: 'bad', name: 'Bad', kind: 'gallery', origin: 'javascript:alert(1)', item_path: '/item/:id' },
  ],
})
const lists = { sites, languages: ['ar', 'en', 'fr'] }

describe('parseQuery: only slugs from sites.json, never an address', () => {
  it('keeps every valid value', () => {
    expect(parseQuery({ q: 'mihrab', lang: 'ar', site: 'ceramics', type: 'object', from: 'islamicart' }, lists)).toEqual({
      q: 'mihrab', lang: 'ar', site: 'ceramics', type: 'object', from: 'islamicart',
    })
  })

  it.each([
    'https://evil.test', '//evil.test', 'javascript:alert(1)', 'data:text/html,x', 'unknown-site', 'bad', 'Islamicart',
    '../islamicart', 'islamicart/../../x', '%2F%2Fevil.test', ' islamicart',
  ])('drops from=%j and site=%j', (value) => {
    const s = parseQuery({ q: 'x', from: value, site: value }, lists)
    expect(s.from).toBe('')
    expect(s.site).toBe('')
  })

  it('drops a language the package lacks, a type that is not searched, and arrays', () => {
    expect(parseQuery({ lang: 'zz', type: 'picture' }, lists)).toMatchObject({ lang: '', type: '' })
    expect(parseQuery({ q: ['a', 'b'], from: ['https://evil.test', 'islamicart'] }, lists)).toMatchObject({ q: 'a', from: '' })
  })

  it('caps the text', () => {
    expect(parseQuery({ q: 'x'.repeat(500) }, lists).q).toHaveLength(200)
  })
})

describe('siteUrl: every link is an origin of sites.json plus a route', () => {
  it('builds <origin>/#<route>', () => {
    expect(siteUrl(sites, 'islamicart', '/item/abc')).toBe('https://museumwithnofrontiers.github.io/islamicart/#/item/abc')
  })
  it.each([['evil', '/item/x'], ['bad', '/item/x'], ['islamicart', '//evil.test'], ['islamicart', 'https://evil.test'], ['islamicart', '/item x']])(
    'refuses %j %j', (slug, route) => {
      expect(siteUrl(sites, slug, route)).toBeNull()
    },
  )
})

describe('the request', () => {
  it('filters only on checked values and asks for every word', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ hits: [{ id: 'a' }], estimatedTotalHits: 1 }) }))
    const search = parseQuery({ q: 'المحراب', lang: 'ar', site: 'ceramics', type: 'object' }, lists)
    const page = await searchItems('https://search.example', search, 20, { fetch: fetchImpl })
    expect(page).toEqual({ hits: [{ id: 'a' }], total: 1 })
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://search.example/indexes/items/search')
    expect(JSON.parse(init.body)).toEqual({
      q: 'المحراب', offset: 20, limit: 20, matchingStrategy: 'all',
      filter: ['languages = "ar"', 'sites.site = "ceramics"', 'type = "object"'], locales: ['ara'],
    })
    expect(toQuery(search)).toEqual({ q: 'المحراب', lang: 'ar', site: 'ceramics', type: 'object' })
    expect(filterOf(parseQuery({ q: 'x' }, lists))).toEqual([])
  })

  it('shows a result in the display language, else English, else the first it has', () => {
    const hit = { languages: ['ar', 'en'], texts: { ar: { name: 'محراب', partner: [], dates: [] }, en: { name: 'Mihrab', partner: ['MIA'], dates: ['12th c.'] } } }
    expect(inLanguage(hit, 'ar').name).toBe('محراب')
    expect(inLanguage(hit, 'fr')).toMatchObject({ language: 'en', name: 'Mihrab', partner: 'MIA', dates: '12th c.' })
    expect(inLanguage({ languages: ['ar'], texts: { ar: { name: 'محراب' } } }, 'fr')).toMatchObject({ language: 'ar', name: 'محراب' })
  })
})
