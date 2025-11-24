import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMessagesStore = defineStore('messages', () => {
  // State
  const messages = ref([])
  const currentTime = ref(new Date())
  const currentFlashIndex = ref(0)

  // Computed
  const apiBase = computed(() => {
    if (process.client) {
      return `http://${window.location.hostname}:80/api`
    }
    return 'http://localhost:80/api'
  })

  const dayOfWeek = computed(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[currentTime.value.getDay()]
  })

  const clockTime = computed(() => {
    let hours = currentTime.value.getHours()
    const minutes = currentTime.value.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'

    hours = hours % 12
    hours = hours ? hours : 12 // 0 should be 12

    const minutesStr = minutes < 10 ? '0' + minutes : minutes

    return `${hours}:${minutesStr} ${ampm}`
  })

  const timePeriod = computed(() => {
    const hour = currentTime.value.getHours()

    if (hour >= 5 && hour < 12) return 'Morning'
    if (hour >= 12 && hour < 13) return 'Lunchtime'
    if (hour >= 13 && hour < 17) return 'Afternoon'
    if (hour >= 17 && hour < 21) return 'Evening'
    return 'Night'
  })

  // Actions
  async function fetchMessages() {
    try {
      const response = await fetch(`${apiBase.value}/messages/active`)
      const newMessages = await response.json()

      // Only update if messages changed to avoid unnecessary re-renders
      if (JSON.stringify(messages.value) !== JSON.stringify(newMessages)) {
        messages.value = newMessages
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  function updateClock() {
    currentTime.value = new Date()
  }

  function cycleFlashColors() {
    currentFlashIndex.value++
  }

  return {
    // State
    messages,
    currentTime,
    currentFlashIndex,

    // Computed
    apiBase,
    dayOfWeek,
    clockTime,
    timePeriod,

    // Actions
    fetchMessages,
    updateClock,
    cycleFlashColors
  }
})
