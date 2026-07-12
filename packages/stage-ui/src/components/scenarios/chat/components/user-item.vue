<script setup lang="ts">
import type { ChatHistoryItem, ChatMessage } from '../../../../types/chat'

import { isStageCapacitor, isStageWeb } from '@proj-airi/stage-shared'
import { computed, shallowRef } from 'vue'

import { MarkdownRenderer } from '../../../markdown'
import { ChatActionMenu } from '../components/action-menu'
import { getChatHistoryItemCopyText, getChatHistoryUserDisplayText, getImageUrlsFromContentParts, normalizeChatContentParts } from '../utils'

const props = withDefaults(defineProps<{
  message: Extract<ChatMessage, { role: 'user' }>
  label: string
  variant?: 'desktop' | 'mobile'
}>(), {
  variant: 'desktop',
})

const emit = defineEmits<{
  (e: 'copy'): void
  (e: 'delete'): void
}>()

const content = computed(() => {
  return getChatHistoryUserDisplayText(props.message as ChatHistoryItem)
})

const imageUrls = computed(() => {
  return getImageUrlsFromContentParts(normalizeChatContentParts(props.message.content))
})

const previewImage = shallowRef<{ url: string, title: string } | null>(null)

function openAttachmentPreview(url: string, index: number) {
  previewImage.value = {
    title: `Image attachment ${index + 1}`,
    url,
  }
}

function closeImagePreview() {
  previewImage.value = null
}

const containerClasses = computed(() => [
  'flex',
  props.variant === 'mobile' ? 'ml-0 flex-row' : 'ml-12 flex-row-reverse',
])

const boxClasses = computed(() => [
  props.variant === 'mobile' ? 'px-2 py-2 text-sm bg-neutral-100/90 dark:bg-neutral-800/90' : 'px-3 py-3 bg-neutral-100/80 dark:bg-neutral-800/80',
])
const copyText = computed(() => getChatHistoryItemCopyText(props.message as ChatHistoryItem))
</script>

<template>
  <div v-if="message.role === 'user'" :class="containerClasses" class="ph-no-capture">
    <ChatActionMenu
      :copy-text="copyText"
      placement="left"
      @copy="emit('copy')"
      @delete="emit('delete')"
    >
      <template #default="{ setMeasuredElement }">
        <div
          :ref="setMeasuredElement"
          flex="~ col" shadow="sm neutral-200/50 dark:none"
          min-w-20 rounded-xl h="unset <sm:fit"
          :class="[
            boxClasses,
            (isStageWeb() || isStageCapacitor()) && props.variant === 'mobile' ? 'select-none sm:select-auto' : '',
          ]"
        >
          <div>
            <span text-sm text="black/60 dark:white/65" font-normal class="inline <sm:hidden">{{ label }}</span>
          </div>
          <MarkdownRenderer
            v-if="content"
            :content="content as string"
            preview-images
            class="break-words"
          />
          <div v-if="imageUrls.length" class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="(url, index) in imageUrls"
              :key="`${url.slice(0, 48)}:${index}`"
              type="button"
              :aria-label="`Open image attachment ${index + 1}`"
              :class="[
                'h-20 w-20 overflow-hidden rounded-md outline-none',
                'cursor-pointer transition-transform active:scale-[0.98]',
                'focus-visible:ring-2 focus-visible:ring-primary-500/70',
              ]"
              @click.stop="openAttachmentPreview(url, index)"
            >
              <img
                :src="url"
                :alt="`Image attachment ${index + 1}`"
                class="h-full w-full object-cover transition-opacity hover:opacity-90"
              >
            </button>
          </div>
        </div>
      </template>
    </ChatActionMenu>

    <Teleport to="body">
      <Transition name="chat-image-preview-fade">
        <div
          v-if="previewImage"
          class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          @click.self="closeImagePreview"
        >
          <div
            role="dialog"
            aria-modal="true"
            :aria-label="previewImage.title"
            :class="[
              'relative max-h-[90vh] max-w-[94vw] overflow-hidden rounded-xl',
              'bg-black/30 shadow-2xl',
            ]"
          >
            <button
              type="button"
              :class="[
                'absolute right-2 top-2 z-10 h-8 w-8 flex items-center justify-center rounded-full',
                'bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75',
              ]"
              title="Close preview"
              @click="closeImagePreview"
            >
              <div class="i-solar:close-circle-bold-duotone text-lg" />
            </button>
            <img
              :src="previewImage.url"
              :alt="previewImage.title"
              class="max-h-[88vh] max-w-[94vw] object-contain"
            >
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.chat-image-preview-fade-enter-active,
.chat-image-preview-fade-leave-active {
  transition: opacity 0.16s ease;
}

.chat-image-preview-fade-enter-from,
.chat-image-preview-fade-leave-to {
  opacity: 0;
}
</style>
