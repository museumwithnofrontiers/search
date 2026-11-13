import { mwnfLinks, sectionMeta } from '@museumwnf/viewer-core'
import manifest from '@museumwnf/search-data/manifest.json'
import SiteShell from './SiteShell.vue'
import SearchView from './views/SearchView.vue'

// The global search (inventory-app M15, ADR 005): one page that searches
// every site's items through the public edge and opens each result in the
// sites that show it. It reads `sites.json` and `manifest.json` from its
// package, never the documents: those are the search service's.

// The interface comes in every language the search bundle of viewer-i18n is
// complete in; the results come in every language of the package.
const languages = ['ar', 'cs', 'de', 'el', 'en', 'es', 'fr', 'it', 'pt', 'se', 'tr']

const nativeName = (code) => {
  const tag = code === 'se' ? 'sv' : code
  try {
    return new Intl.DisplayNames([tag], { type: 'language' }).of(tag)
  } catch {
    return code.toUpperCase()
  }
}

export default {
  datasetPackage: '@museumwnf/search-data',
  siteName: 'Museum With No Frontiers',
  site: { origin: 'https://museumwithnofrontiers.github.io/search', slug: 'search' },

  // The public edge: only the search route and /health answer there. The
  // local Docker edge (inventory-app compose profile `search`) in development.
  search: {
    api: import.meta.env.DEV ? 'http://localhost:8091' : 'https://search.metanull.eu',
    languages: manifest.languages ?? [],
  },

  features: { entities: [] },
  views: { home: SearchView },
  languages,
  shell: SiteShell,
  navigation: {
    languages: languages.map((code) => ({ code, label: nativeName(code) })),
    links: [],
  },
  links: mwnfLinks,
  extraViews: [],
  legacyRoutes: [],
  meta: sectionMeta(),
}
