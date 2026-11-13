import {
  CATALOGUE_DATE_MODE, CATALOGUE_PAGE_SIZE, centuryPresets, searchFieldOptions, searchFields, searchRowKeys,
  searchSummary, useFieldSearch,
} from '@museumwnf/viewer-core'
import { countryLabel, itemRow } from './data.js'

// What this website's search, results and record pages show. The pages are
// viewer-layout's composed views (`SearchFormView`, `CatalogueResultsView`,
// `RecordView`); these declarations are the whole of what the website
// decides. Every label is an entry name, written out, that the view resolves.

// ── The field search ───────────────────────────────────────────────────────
//
// Legacy's `database.php` form: keyword rows, each naming a field, folded
// with AND/OR. The fields are viewer-core's (`searchFields`); pass
// `{ dynastyLabel }` to search dynasties too, where the package carries them.

export const SEARCH_FIELDS = searchFields()

export const catalogueSearchSpec = {
  mode: 'rows',
  fields: searchFieldOptions(SEARCH_FIELDS),
  dates: { presets: centuryPresets() },
  target: 'catalogue',
  showAllLabel: 'catalogue.search.showAll',
  howTo: false,
}

// The index behind the results page: one for the website's life. `narrow`
// keeps its rank order over whatever the page's own filters let through.
const { narrow } = useFieldSearch({ fields: SEARCH_FIELDS })

// ── The results page ───────────────────────────────────────────────────────
//
// The keyword rows the search form writes, a country facet and the years.
// The date rule is decision D5's standalone one (`overlap`: a record with one
// date still matches); a website names its rule once and never merges the
// two. Add a facet with a line in `facets` and one in `controls`; a filter the
// engine does not know is a `match(record, filters)` predicate. The row is
// `itemRow`'s, the one every catalogue website shares, its `meta` naming what
// follows the record's name.

export const catalogueResultsSpec = {
  entity: 'items',
  keys: [...searchRowKeys(), 'country', 'from', 'to'],
  facets: {
    country: { field: 'country_id', label: countryLabel },
  },
  controls: [
    { key: 'country', label: 'catalogue.facet.country', anyLabel: 'catalogue.facet.any' },
    { key: 'from', type: 'year', label: 'catalogue.facet.fromYear' },
    { key: 'to', type: 'year', label: 'catalogue.facet.toYear' },
  ],
  filterTitle: 'catalogue.filter.heading',
  narrow,
  // The field search already ordered the matches (or the entity order stood,
  // on an empty query); resorting here would discard that order.
  sort: false,
  dates: { mode: CATALOGUE_DATE_MODE, begin: 'from', end: 'to' },
  pageSize: CATALOGUE_PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  record: (item) => itemRow(item, ['country', 'dates', 'location']),
  summary: (ctx) => searchSummary(ctx),
}

// ── The record page ────────────────────────────────────────────────────────
//
// Which fields a record shows, in what order, under which labels. `value` is
// a translation field, a record field through a function, or a function of
// the context; `render` is `inline` (the default), `block`, `link` or `custom`
// (handed to a slot named after the key). `sections` are the prose blocks
// under the sheet. A field with no value is dropped, so the list may be
// generous. Labels are the shared `sheet.field.*` entries; add a website
// entry only for a label the shared vocabulary does not have.

export const itemSheetSpec = {
  entity: 'items',
  translations: [],
  fields: [
    { key: 'location', label: 'sheet.field.location', value: (ctx) => [ctx.text.location, countryLabel(ctx.record.country_id)].filter(Boolean).join(', ') },
    { key: 'holder', label: 'sheet.field.holdingMuseum', value: 'holder' },
    { key: 'date', label: 'sheet.field.date', value: 'dates' },
    // The page's language's own artist line: legacy printed each language's,
    // and the record's `artist_names` come from one language's line.
    { key: 'artists', label: 'sheet.field.artists', value: 'artist' },
    { key: 'inventoryNumber', label: 'sheet.field.inventoryNumber', value: (ctx) => ctx.record.owner_reference },
    { key: 'materials', label: 'sheet.field.materials', value: 'type' },
    { key: 'dimensions', label: 'sheet.field.dimensions', value: 'dimensions' },
    { key: 'provenance', label: 'sheet.field.provenance', value: 'provenance' },
  ],
  sections: [
    { key: 'description', label: 'sheet.field.description', value: 'description' },
    { key: 'bibliography', label: 'sheet.field.bibliography', value: 'bibliography' },
  ],
  layout: 'table',
  related: { variant: 'list' },
  back: { label: 'record.action.backToResults', to: { name: 'catalogue' } },
}
