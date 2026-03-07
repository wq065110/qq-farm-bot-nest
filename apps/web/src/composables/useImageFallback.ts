import { ref } from 'vue'

export function useImageFallback() {
  const imageErrors = ref<Record<string | number, boolean>>({})

  function onImageError(id: string | number): void {
    imageErrors.value[id] = true
  }

  function hasImageError(id: string | number): boolean {
    return !!imageErrors.value[id]
  }

  function resetImageErrors(): void {
    imageErrors.value = {}
  }

  return { imageErrors, onImageError, hasImageError, resetImageErrors }
}
