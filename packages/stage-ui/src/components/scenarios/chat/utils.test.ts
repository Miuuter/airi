import type { ChatHistoryItem } from '../../../types/chat'

import { describe, expect, it } from 'vitest'

import {
  getChatHistoryItemCopyText,
  getChatHistoryItemKey,
  getChatHistoryUserDisplayText,
  getImageUrlsFromContentParts,
  normalizeChatContentParts,
} from './utils'

describe('chat history utils', () => {
  it('extracts text and image URLs from content part arrays', () => {
    const imageUrl = 'data:image/png;base64,aW1hZ2U='
    const message = {
      role: 'user',
      content: [
        { type: 'text', text: 'look at this' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    } satisfies ChatHistoryItem

    expect(getChatHistoryUserDisplayText(message)).toBe('look at this')
    expect(getImageUrlsFromContentParts(normalizeChatContentParts(message.content))).toEqual([imageUrl])
    expect(getChatHistoryItemCopyText(message)).toBe('look at this')
  })

  it('parses serialized content parts instead of showing raw base64 JSON', () => {
    const imageUrl = 'data:image/png;base64,aW1hZ2U='
    const message = {
      role: 'user',
      content: JSON.stringify([
        { type: 'text', text: 'serialized image' },
        { type: 'image_url', image_url: { url: imageUrl } },
      ]),
    } satisfies ChatHistoryItem

    const parts = normalizeChatContentParts(message.content)

    expect(getChatHistoryUserDisplayText(message)).toBe('serialized image')
    expect(getImageUrlsFromContentParts(parts)).toEqual([imageUrl])
    expect(getChatHistoryItemCopyText(message)).toBe('serialized image')
  })

  it('builds data URLs from image attachment shaped parts', () => {
    const parts = normalizeChatContentParts([
      { type: 'text', text: 'attachment image' },
      { type: 'image', data: 'aW1hZ2U=', mimeType: 'image/jpeg' },
    ])

    expect(getImageUrlsFromContentParts(parts)).toEqual(['data:image/jpeg;base64,aW1hZ2U='])
  })

  it('parses serialized message objects that contain content parts', () => {
    const imageUrl = 'data:image/png;base64,aW1hZ2U='
    const message = {
      role: 'user',
      content: JSON.stringify({
        role: 'user',
        content: [
          { type: 'text', text: 'serialized object image' },
          { type: 'input_image', image_url: imageUrl },
        ],
      }),
    } satisfies ChatHistoryItem

    const parts = normalizeChatContentParts(message.content)

    expect(getChatHistoryUserDisplayText(message)).toBe('serialized object image')
    expect(getImageUrlsFromContentParts(parts)).toEqual([imageUrl])
    expect(getChatHistoryItemCopyText(message)).toBe('serialized object image')
  })

  it('treats serialized single image parts as images instead of text', () => {
    const imageUrl = 'data:image/png;base64,aW1hZ2U='
    const message = {
      role: 'user',
      content: JSON.stringify({ type: 'image_url', image_url: { url: imageUrl } }),
    } satisfies ChatHistoryItem

    const parts = normalizeChatContentParts(message.content)

    expect(getChatHistoryUserDisplayText(message)).toBe('')
    expect(getImageUrlsFromContentParts(parts)).toEqual([imageUrl])
    expect(getChatHistoryItemCopyText(message)).toBe('')
  })
})

describe('getChatHistoryItemKey', () => {
  it('prefers stable message ids when available', () => {
    const createdAt = 1700000000000

    const userMessage: ChatHistoryItem = { role: 'user', content: 'hi', createdAt, id: 'user-1' }
    const assistantMessage: ChatHistoryItem = { role: 'assistant', content: 'hello', createdAt, id: 'assistant-1', slices: [], tool_results: [] }

    expect(getChatHistoryItemKey(userMessage, 0)).toBe('user-1')
    expect(getChatHistoryItemKey(assistantMessage, 1)).toBe('assistant-1')
  })

  it('falls back to a role + timestamp + index composite when ids are missing', () => {
    const createdAt = 1700000000000

    const userMessage: ChatHistoryItem = { role: 'user', content: 'hi', createdAt }
    const assistantMessage: ChatHistoryItem = { role: 'assistant', content: 'hello', createdAt, slices: [], tool_results: [] }

    expect(getChatHistoryItemKey(userMessage, 0)).toBe('user:1700000000000:0')
    expect(getChatHistoryItemKey(assistantMessage, 1)).toBe('assistant:1700000000000:1')
  })

  it('falls back to index when message is missing', () => {
    expect(getChatHistoryItemKey(undefined, 0)).toBe(0)
    expect(getChatHistoryItemKey(undefined, 1)).toBe(1)
  })

  it('falls back to a role + index composite when ids and timestamps are missing', () => {
    const userMessage: ChatHistoryItem = { role: 'user', content: 'hi' }
    const assistantMessage: ChatHistoryItem = { role: 'assistant', content: 'hello', slices: [], tool_results: [] }

    expect(getChatHistoryItemKey(userMessage, 0)).toBe('user:0')
    expect(getChatHistoryItemKey(assistantMessage, 1)).toBe('assistant:1')
  })
})
