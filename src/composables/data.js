import { useCatalogue } from '@museumwnf/viewer-core'

// This website's records, read the one way every website reads them: through
// viewer-core's catalogue data layer, lazily. Each entity is a shared ref that
// stays `null` until a route declaring it in `meta.entities` brings its chunk
// in, so a page pays only for the records it reads. Importing this module
// starts loading the English texts of the `eager` entities, which every
// label on every page reads.
//
// `useCatalogue` holds what every catalogue website otherwise re-typed: the
// entity refs and lookups, the labels, the routes, the result row, the
// translations and the Markdown pipeline. This file holds no state of its
// own, and nothing here imports `@inventory-data`: the alias is viewer-core's
// to read. What is this website's own goes beside it — a visibility rule
// (`visible: { items: (item) => … }`), a collection tree, its legacy address
// mappings.

export const data = useCatalogue({
  // The entities whose English texts `loadEnglish` loads up front.
  eager: ['items', 'countries', 'partners'],
})
data.loadEnglish()

export const {
  items, itemById, countryById, partnerById,
  itemLabel, countryLabel, partnerLabel, itemRoute, itemRow,
  tr, md, mdInline, mdStrip,
} = data
