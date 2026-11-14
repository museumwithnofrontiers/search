# search

The global search of the Museum With No Frontiers websites (inventory-app milestone M15, ADR 005): one search over every item a site shows, in every language, each result opening in the sites that show it.

- **What it searches:** `https://search.metanull.eu`, the public edge of the inventory's Meilisearch, which answers only the search route. The index is loaded from the pinned `@museumwnf/search-data` by inventory-app's `scripts/search`.
- **What it reads from its package:** `sites.json` (the sites by slug: name, origin, item route) and `manifest.json` (the languages). Never the documents.
- **Texts:** `@museumwnf/viewer-i18n/search` (`core`, `layout`, `catalogue`, `search`), plus `locales/` for its own entries (`globalsearch.*`).

## The link contract

```
https://museumwithnofrontiers.github.io/search/#/?q=<text>&in=<field>&since=<year>&until=<year>&searchlang=<code>&site=<slug>&type=<type>&from=<slug>
```

- `site` and `from` are accepted only when the slug is in `sites.json`; anything else, an address included, is dropped and never echoed.
- `in` limits the words to one field, after legacy's database search form: `name`, `keyword`, `place` (location and provenance), `dynasty`, `artist` (architect, artist, master and patron) or `material`. Without it, every field is searched.
- `since` and `until` are whole years, negative before Christ. An item counts when its dates meet the range, as on legacy: its end date (else its start date) is not before `since`, and its start date is not after `until`.
- `searchlang` must be one of the package's languages, and `type` one of `object`, `monument`, `detail`.
- `lang` is the display language, as on every site (viewer-core keeps it in the address). It never filters the results.
- Every link the page writes is a `sites.json` origin plus a route (`src/search/contract.js`, tested in `tests/contract.test.js`).

A site sends its visitors here with viewer-core's `globalSearch` setting and viewer-layout's search box, which put its own slug in `from`.

## Development

```bash
docker compose up
```

In development the page searches `http://localhost:8091`: start inventory-app's compose profile `search` and load an export into it (inventory-app `scripts/search/README.md`).

```bash
npm test
```

```bash
npm run build
```

## Licence

See [LICENSE.md](LICENSE.md).
