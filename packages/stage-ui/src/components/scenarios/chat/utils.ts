import type { ChatHistoryItem } from '../../../types/chat'

function isTextPart(part: unknown): part is { type: 'text', text?: string } {
  return typeof part === 'object'
    && part !== null
    && 'type' in part
    && part.type === 'text'
    && 'text' in part
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isContentPartArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
    && value.some(part => isRecord(part) && typeof part.type === 'string')
}

function parseSerializedContentParts(content: string): unknown[] | undefined {
  const trimmed = content.trim()
  if (!trimmed.startsWith('[') && !trimmed.startsWith('{'))
    return undefined

  try {
    const parsed = JSON.parse(trimmed) as unknown
    return normalizeChatContentParts(parsed)
  }
  catch {
    return undefined
  }
}

export function normalizeChatContentParts(content: unknown): unknown[] {
  if (isContentPartArray(content))
    return content

  if (typeof content === 'string')
    return parseSerializedContentParts(content) ?? []

  if (isRecord(content)) {
    if (isContentPartArray(content.content))
      return content.content

    if (typeof content.content === 'string') {
      const nestedParts = parseSerializedContentParts(content.content)
      if (nestedParts?.length)
        return nestedParts
    }

    if (typeof content.type === 'string')
      return [content]
  }

  return []
}

export function getTextFromContentParts(parts: unknown[]): string {
  return parts.reduce<string[]>((texts, part) => {
    if (!isTextPart(part))
      return texts

    const text = part.text?.trim()
    if (text)
      texts.push(text)

    return texts
  }, []).join('\n\n')
}

function imageUrlFromPart(part: unknown): string | undefined {
  if (!isRecord(part))
    return undefined

  const type = typeof part.type === 'string' ? part.type : ''
  const imageUrl = part.image_url ?? part.imageUrl

  if (type === 'image_url' || type === 'input_image') {
    if (typeof imageUrl === 'string')
      return imageUrl

    if (isRecord(imageUrl) && typeof imageUrl.url === 'string')
      return imageUrl.url

    if (typeof part.url === 'string')
      return part.url
  }

  if (type === 'image') {
    if (typeof part.url === 'string')
      return part.url

    if (typeof part.imageDataUrl === 'string')
      return part.imageDataUrl

    const data = typeof part.data === 'string' ? part.data : undefined
    const mimeType = typeof part.mimeType === 'string' ? part.mimeType : 'image/png'
    if (data && mimeType.startsWith('image/')) {
      return data.startsWith('data:')
        ? data
        : `data:${mimeType};base64,${data}`
    }
  }

  return undefined
}

export function getImageUrlsFromContentParts(parts: unknown[]): string[] {
  return parts
    .map(imageUrlFromPart)
    .filter((url): url is string => typeof url === 'string' && url.length > 0)
}

export function getChatHistoryUserDisplayText(message: ChatHistoryItem): string {
  const parts = normalizeChatContentParts(message.content)
  if (parts.length)
    return getTextFromContentParts(parts)

  return typeof message.content === 'string' ? message.content : ''
}

export function getChatHistoryItemCopyText(message: ChatHistoryItem): string {
  if (message.role === 'error')
    return message.content

  if (message.role === 'assistant') {
    if (message.slices?.length) {
      const text = message.slices
        .filter(slice => slice.type === 'text')
        .map(slice => slice.text.trim())
        .filter(Boolean)
        .join('\n\n')

      if (text)
        return text
    }

    if (typeof message.content === 'string')
      return message.content

    if (Array.isArray(message.content)) {
      const text = getTextFromContentParts(message.content)

      if (text)
        return text

      return message.content.map(entry => JSON.stringify(entry)).join('\n')
    }

    return ''
  }

  if (typeof message.content === 'string')
    return getChatHistoryUserDisplayText(message)

  if (Array.isArray(message.content)) {
    const text = getTextFromContentParts(message.content)

    if (text)
      return text

    return ''
  }

  return ''
}

export function getChatHistoryItemKey(message: ChatHistoryItem | undefined, index: number): string | number {
  if (!message)
    return index

  if (message.id)
    return message.id

  if (message.createdAt != null)
    return `${message.role}:${message.createdAt}:${index}`

  return `${message.role}:${index}`
}
