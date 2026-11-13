<script setup>
// The page structure is viewer-layout's SiteShell. The lockup is the
// organisation's name and the search's own title, both texts.
import { useI18n } from '@museumwnf/viewer-core'
import { SiteShell } from '@museumwnf/viewer-layout/components'

const { t } = useI18n()
</script>

<template>
  <SiteShell v-bind="$attrs" header-home="#/">
    <template #brand>
      <span class="site-logo">
        <span class="site-logo-org">{{ t('globalsearch.identity.organisation') }}</span>
        <span class="site-logo-title">{{ t('layout.globalSearch.label') }}</span>
      </span>
    </template>
    <slot />
  </SiteShell>
</template>

<style scoped>
.site-logo {
  display: flex;
  flex-direction: column;
  gap: 1px;
  color: var(--mwnf-header-text);
}
.site-logo-org {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.8;
}
.site-logo-title {
  font-size: 24px;
  font-weight: 400;
}
</style>
