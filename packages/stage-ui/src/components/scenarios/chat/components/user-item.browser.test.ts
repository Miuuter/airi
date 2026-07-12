import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'
import { createI18n } from 'vue-i18n'

import ChatUserItem from './user-item.vue'

describe('chat user image attachments', () => {
  it('renders an attachment thumbnail and opens its preview', async () => {
    const imageUrl = 'data:image/png;base64,aW1hZ2U='
    const screen = await render(ChatUserItem, {
      props: {
        message: {
          role: 'user',
          content: [
            { type: 'text', text: 'Look at this' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
        label: 'You',
      },
      global: {
        plugins: [createI18n({
          legacy: false,
          locale: 'en',
          messages: { en: {} },
        })],
      },
    })

    await screen.getByRole('button', { name: 'Open image attachment 1' }).click()

    await expect.element(screen.getByRole('dialog', { name: 'Image attachment 1' })).toBeVisible()
  })
})
