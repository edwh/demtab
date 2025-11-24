import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMessagesStore = defineStore('messages', () => {
  // State
  const messages = ref([])
  const currentTime = ref(new Date())
  const currentFlashIndex = ref(0)
  const isNightTime = ref(false)
  const motionDetected = ref(true)
  const screenOff = ref(false)

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

  // SSE connection for real-time updates
  let eventSource: EventSource | null = null

  function connectSSE() {
    if (!process.client) return

    const sseUrl = `http://${window.location.hostname}:80/api/events`
    eventSource = new EventSource(sseUrl)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.screenOff !== undefined) {
          console.log('SSE: screen state update', data)
          screenOff.value = data.screenOff
          // When screen wakes up, immediately fetch messages
          if (data.screenOff === false) {
            fetchMessages()
          }
        }
        if (data.motionDetected !== undefined) {
          motionDetected.value = data.motionDetected
        }
      } catch (error) {
        console.error('SSE parse error:', error)
      }
    }

    eventSource.onerror = () => {
      console.log('SSE connection lost, will reconnect...')
      eventSource?.close()
      // Reconnect after 5 seconds
      setTimeout(connectSSE, 5000)
    }

    console.log('SSE connected for real-time updates')
  }

  function disconnectSSE() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }

  // Actions
  async function fetchMessages() {
    try {
      const response = await fetch(`${apiBase.value}/messages/active`)
      const data = await response.json()

      // Handle new API response format with isNightTime and motionDetected
      const newMessages = data.messages || data
      isNightTime.value = data.isNightTime || false
      motionDetected.value = data.motionDetected !== undefined ? data.motionDetected : true

      // Only update if messages changed to avoid unnecessary re-renders
      if (JSON.stringify(messages.value) !== JSON.stringify(newMessages)) {
        messages.value = newMessages
      }

      // Use screenOff from API response (server controls the actual backlight)
      screenOff.value = data.screenOff || false
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
    isNightTime,
    motionDetected,
    screenOff,

    // Computed
    apiBase,
    dayOfWeek,
    clockTime,
    timePeriod,

    // Actions
    fetchMessages,
    updateClock,
    cycleFlashColors,
    connectSSE,
    disconnectSSE
  }
})
