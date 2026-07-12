import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-vue'

import ChatResponsePart from './response-part.vue'

describe('chat response reasoning', () => {
  it.each(['desktop', 'mobile'] as const)('renders assistant reasoning content in the %s layout', async (variant) => {
    const screen = await render(ChatResponsePart, {
      props: {
        message: {
          role: 'assistant',
          content: 'Visible answer',
          slices: [],
          tool_results: [],
          categorization: {
            speech: 'Visible answer',
            reasoning: 'Reasoning remains visible',
          },
        },
        variant,
      },
    })

    await expect.element(screen.getByText('Reasoning remains visible')).toBeVisible()
  })
})
