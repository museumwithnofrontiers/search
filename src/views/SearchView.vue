<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n, useLocale, useSiteConfig } from '@museumwnf/viewer-core'
import sitesFile from '@museumwnf/search-data/sites.json'
import manifest from '@museumwnf/search-data/manifest.json'
import { TYPES, parseQuery, siteIndex, siteUrl, toQuery } from '../search/contract.js'
import { PAGE_SIZE, inLanguage, searchItems } from '../search/api.js'

// The global search (inventory-app M15, ADR 005): every item a site shows,
// searched in every language through search.metanull.eu, each result opening
// in the sites that show it. The address holds the search (contract.js), so a
// search can be shared and the back button works.
const { t } = useI18n()
const locale = useLocale()
const route = useRoute()
const router = useRouter()
const config = useSiteConfig()

const sites = siteIndex(sitesFile)
const languages = manifest.languages ?? []
// The sites an item can open in, for the filter: the search site itself shows none.
const siteOptions = [...sites.values()].filter((s) => s.kind !== 'search').sort((a, b) => a.name.localeCompare(b.name))

const search = computed(() => parseQuery(route.query, { sites, languages }))
const term = ref(search.value.q)
watch(() => search.value.q, (q) => { term.value = q })

const hits = ref([])
const total = ref(0)
const state = ref('idle') // idle | loading | done | error
let controller = null
let timer = null

async function run(offset = 0) {
  const s = search.value
  if (!s.q) {
    hits.value = []
    total.value = 0
    state.value = 'idle'
    return
  }
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  try {
    const page = await searchItems(config.search.api, s, offset, { signal: controller.signal })
    hits.value = offset === 0 ? page.hits : [...hits.value, ...page.hits]
    total.value = page.total
    state.value = 'done'
  } catch (error) {
    if (error?.name === 'AbortError') return
    state.value = 'error'
  }
}

watch(search, () => run(0), { immediate: true, deep: true })
onBeforeUnmount(() => { controller?.abort(); clearTimeout(timer) })

// Typing searches after a pause; the address is updated, and the watch above runs it.
function update(changes) {
  router.replace({ query: toQuery({ ...search.value, ...changes }) })
}
function typed() {
  clearTimeout(timer)
  timer = setTimeout(() => update({ q: term.value.trim() }), 300)
}
function submitted() {
  clearTimeout(timer)
  update({ q: term.value.trim() })
}

// Each type's label, spelled out so the texts check can see every name.
const typeLabel = (type) =>
  type === 'object' ? t('search.type.object') : type === 'monument' ? t('search.type.monument') : type === 'detail' ? t('search.type.detail') : ''

const languageName = (code) => {
  try {
    return new Intl.DisplayNames([code === 'se' ? 'sv' : code], { type: 'language' }).of(code === 'se' ? 'sv' : code)
  } catch {
    return code.toUpperCase()
  }
}

const results = computed(() =>
  hits.value.map((hit) => ({
    id: hit.id,
    type: TYPES.includes(hit.type) ? hit.type : '',
    picture: typeof hit.picture === 'string' && hit.picture.startsWith('https://') ? hit.picture : '',
    shown: inLanguage(hit, locale.value),
    links: (hit.sites ?? [])
      .map((link) => ({ name: sites.get(link.site)?.name ?? '', href: siteUrl(sites, link.site, link.path) }))
      .filter((link) => link.href),
  })),
)
const back = computed(() => {
  const from = sites.get(search.value.from)
  return from ? { name: from.name, href: siteUrl(sites, from.slug, '/') } : null
})
</script>

<template>
  <section class="search-page">
    <p v-if="back" class="search-back">
      <a :href="back.href">{{ t('search.results.backTo') }} {{ back.name }}</a>
    </p>

    <form class="search-form" role="search" @submit.prevent="submitted">
      <input
        v-model="term"
        class="search-input"
        type="search"
        :placeholder="t('layout.globalSearch.label')"
        :aria-label="t('layout.globalSearch.label')"
        @input="typed"
      />
      <button class="search-submit" type="submit">{{ t('catalogue.search.submit') }}</button>
    </form>

    <div class="search-filters">
      <label>
        <span>{{ t('catalogue.search.language') }}</span>
        <select :value="search.lang" @change="update({ lang: $event.target.value })">
          <option value="">{{ t('catalogue.search.anyLanguage') }}</option>
          <option v-for="code in languages" :key="code" :value="code" :lang="code">{{ languageName(code) }}</option>
        </select>
      </label>
      <label>
        <span>{{ t('catalogue.facet.type') }}</span>
        <select :value="search.type" @change="update({ type: $event.target.value })">
          <option value="">{{ t('search.facet.allTypes') }}</option>
          <option v-for="type in TYPES" :key="type" :value="type">{{ typeLabel(type) }}</option>
        </select>
      </label>
      <label>
        <span>{{ t('search.facet.site') }}</span>
        <select :value="search.site" @change="update({ site: $event.target.value })">
          <option value="">{{ t('search.facet.allSites') }}</option>
          <option v-for="site in siteOptions" :key="site.slug" :value="site.slug">{{ site.name }}</option>
        </select>
      </label>
    </div>

    <p v-if="state === 'error'" class="search-error" role="alert">{{ t('search.error.unavailable') }}</p>
    <p v-else-if="state === 'done' && !results.length" class="search-empty">{{ t('catalogue.results.noResultsSearch') }}</p>
    <p v-else-if="results.length" class="search-count">{{ t('catalogue.results.itemsFound') }}: {{ total }}</p>

    <ol class="search-results">
      <li v-for="result in results" :key="result.id" class="search-result">
        <img v-if="result.picture" class="search-result__picture" :src="result.picture" alt="" loading="lazy" />
        <div class="search-result__body">
          <p class="search-result__name" :lang="result.shown.language" dir="auto">{{ result.shown.name }}</p>
          <p class="search-result__meta">
            <span v-if="result.type">{{ typeLabel(result.type) }}</span>
            <span v-if="result.shown.partner" dir="auto">{{ result.shown.partner }}</span>
            <span v-if="result.shown.dates" dir="auto">{{ result.shown.dates }}</span>
          </p>
          <p v-if="result.links.length" class="search-result__open">
            {{ t('search.results.openIn') }}:
            <template v-for="(link, i) in result.links" :key="link.href">
              <a :href="link.href">{{ link.name }}</a><span v-if="i < result.links.length - 1">, </span>
            </template>
          </p>
        </div>
      </li>
    </ol>

    <button
      v-if="state === 'done' && hits.length < total && hits.length >= PAGE_SIZE"
      class="search-more"
      type="button"
      @click="run(hits.length)"
    >{{ t('search.results.more') }}</button>
  </section>
</template>
