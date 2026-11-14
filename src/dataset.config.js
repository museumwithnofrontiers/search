import { mwnfLinks, sectionMeta } from '@museumwnf/viewer-core'
import { mwnfSocialLinks } from '@museumwnf/viewer-layout'
import { StandaloneShell } from '@museumwnf/viewer-layout/standalone'
import manifest from '@museumwnf/search-data/manifest.json'
import SearchView from './views/SearchView.vue'

// The chrome is legacy's MWNF portal's own pictures (database_searchform.php),
// kept in this repository under theme/assets/legacy/ (SOURCES.md names where
// each one was taken from) and handed to the layout as one map that Vite
// builds and fingerprints.
const chrome = import.meta.glob('../theme/assets/**/*.{jpg,jpeg,png,gif,svg}', {
  eager: true, query: '?url', import: 'default',
})

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
  languages,

  // The look of legacy's database search page on the MWNF portal: its navy
  // header with the MWNF logo and the portal's two links, its banner with
  // the page's title over it, and its footer. viewer-layout's standalone
  // family shell draws that template, as on Discover Islamic Art and
  // Discover Baroque Art.
  shell: StandaloneShell,
  chrome,
  standalone: {
    logo: { src: 'legacy/logo_inside.png', alt: 'globalsearch.identity.organisation', href: mwnfLinks.portal },
    headerLinks: [
      { label: 'globalsearch.header.portal', href: mwnfLinks.portal },
      { label: 'core.footer.languagePolicy', href: 'https://www.museumwnf.org/about/language-policy' },
    ],
    banner: { inner: 'legacy/banner_inside.jpg' },
  },
  navigation: {
    languages: languages.map((code) => ({ code, label: nativeName(code) })),
    links: [],
    // Legacy's footer, in its order; the copyright line and the year follow.
    footerLinks: [
      { label: 'core.footer.aboutMwnf', href: mwnfLinks.about },
      { label: 'core.footer.contact', href: mwnfLinks.contact },
      { label: 'core.footer.legalNotice', href: mwnfLinks.legalNotice },
      { label: 'core.footer.credits', href: mwnfLinks.credits },
      { label: 'core.footer.languagePolicy', href: 'https://www.museumwnf.org/about/language-policy' },
      { label: 'core.footer.cookies', href: mwnfLinks.cookies },
    ],
    socialLinks: mwnfSocialLinks,
  },
  links: mwnfLinks,
  // The search is the site's one page, titled on its banner as legacy's
  // page was. Its own section, not `home`, so the shell draws an inner
  // page's band.
  extraViews: [
    { path: '/', name: 'home', component: SearchView, meta: { section: 'search', bannerTitle: 'layout.globalSearch.label' } },
  ],
  legacyRoutes: [],
  meta: sectionMeta(),
}
