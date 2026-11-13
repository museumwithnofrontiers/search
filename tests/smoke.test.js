import { describe, expect, it, vi } from 'vitest'
import { mergeMessages } from '@museumwnf/viewer-core'
import { mountSite } from '@museumwnf/viewer-core/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/search'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'

const messages = mergeMessages(sharedTexts, { en: ownTexts })

describe('the search site', () => {
  it('mounts its search page, with the texts of its bundle', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const { app, host } = await mountSite(config, messages)
    expect(host.querySelector('.search-page')).not.toBeNull()
    expect(host.querySelector('.search-title').textContent.trim()).toBe('Search Overall MWNF Database')
    expect(host.querySelector('form[role="search"] input')).not.toBeNull()
    // Nothing is searched before a text is typed.
    expect(fetch).not.toHaveBeenCalled()
    app.unmount()
    vi.unstubAllGlobals()
  }, 20000)
})
