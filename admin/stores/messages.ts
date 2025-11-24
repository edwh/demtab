import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMessagesStore = defineStore('messages', () => {
  // State
  const messages = ref([])
  const showBackupPrompt = ref(false)
  const editingMessage = ref(null)
  const settings = ref({
    call_throttle_enabled: '0',
    call_throttle_minutes: '30',
    call_throttle_message: 'You called Edward a few minutes ago - please wait a bit before calling again',
    night_start: '22:00',
    night_end: '07:00'
  })
  const motionStatus = ref({
    pirAvailable: false,
    motionDetected: false,
    lastMotionTime: null as string | null,
    isNightTime: false
  })
  const motionGrid = ref<Record<number, Record<number, number>>>({})
  const motionLogs = ref<any[]>([])

  // Computed
  const apiBase = computed(() => {
    if (process.client) {
      return `http://${window.location.hostname}:8080/api`
    }
    return 'http://localhost:8080/api'
  })

  // Actions
  async function fetchMessages() {
    try {
      console.log('Fetching messages from:', `${apiBase.value}/messages`)
      const response = await fetch(`${apiBase.value}/messages`)
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Received messages:', data)
      messages.value = data
    } catch (error) {
      console.error('Error fetching messages:', error)
      throw error
    }
  }

  async function createMessage(messageData) {
    try {
      const response = await fetch(`${apiBase.value}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      if (!response.ok) throw new Error('Failed to create message')

      await fetchMessages()
    } catch (error) {
      console.error('Error creating message:', error)
      throw error
    }
  }

  async function updateMessage(id, messageData) {
    try {
      const response = await fetch(`${apiBase.value}/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })

      if (!response.ok) throw new Error('Failed to update message')

      await fetchMessages()
    } catch (error) {
      console.error('Error updating message:', error)
      throw error
    }
  }

  async function deleteMessage(id) {
    try {
      const response = await fetch(`${apiBase.value}/messages/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete message')

      await fetchMessages()
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  async function reorderMessages(orderedIds) {
    try {
      const response = await fetch(`${apiBase.value}/messages/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds })
      })

      if (!response.ok) throw new Error('Failed to reorder messages')
    } catch (error) {
      console.error('Error reordering messages:', error)
      throw error
    }
  }

  async function checkBackupPrompt() {
    try {
      const response = await fetch(`${apiBase.value}/backup/should-prompt`)
      const data = await response.json()

      if (data.shouldPrompt) {
        showBackupPrompt.value = true
      }
    } catch (error) {
      console.error('Error checking backup prompt:', error)
    }
  }

  async function downloadBackup() {
    try {
      const response = await fetch(`${apiBase.value}/backup/download`)
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : 'backup.json'

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading backup:', error)
      throw error
    }
  }

  async function recordBackupPrompt() {
    try {
      await fetch(`${apiBase.value}/backup/record-prompt`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error recording backup prompt:', error)
    }
  }

  async function restoreBackup(backupData) {
    try {
      const response = await fetch(`${apiBase.value}/backup/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backupData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to restore backup')
      }

      await fetchMessages()
    } catch (error) {
      console.error('Error restoring backup:', error)
      throw error
    }
  }

  function setEditingMessage(message) {
    editingMessage.value = message
  }

  function clearEditingMessage() {
    editingMessage.value = null
  }

  function dismissBackupPrompt() {
    showBackupPrompt.value = false
  }

  async function fetchSettings() {
    try {
      const response = await fetch(`${apiBase.value}/settings`)
      const data = await response.json()
      settings.value = data
    } catch (error) {
      console.error('Error fetching settings:', error)
      throw error
    }
  }

  async function updateSettings(newSettings) {
    try {
      const response = await fetch(`${apiBase.value}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })

      if (!response.ok) throw new Error('Failed to update settings')

      await fetchSettings()
    } catch (error) {
      console.error('Error updating settings:', error)
      throw error
    }
  }

  async function fetchMotionStatus() {
    try {
      const response = await fetch(`${apiBase.value}/motion`)
      const data = await response.json()
      motionStatus.value = data
    } catch (error) {
      console.error('Error fetching motion status:', error)
    }
  }

  async function fetchMotionGrid(weeksBack = 4) {
    try {
      const response = await fetch(`${apiBase.value}/motion/grid?weeks=${weeksBack}`)
      const data = await response.json()
      motionGrid.value = data
    } catch (error) {
      console.error('Error fetching motion grid:', error)
    }
  }

  async function fetchMotionLogs(limit = 100) {
    try {
      const response = await fetch(`${apiBase.value}/motion/logs?limit=${limit}`)
      const data = await response.json()
      motionLogs.value = data
    } catch (error) {
      console.error('Error fetching motion logs:', error)
    }
  }

  return {
    // State
    messages,
    showBackupPrompt,
    editingMessage,
    settings,
    motionStatus,
    motionGrid,
    motionLogs,

    // Computed
    apiBase,

    // Actions
    fetchMessages,
    createMessage,
    updateMessage,
    deleteMessage,
    reorderMessages,
    checkBackupPrompt,
    downloadBackup,
    recordBackupPrompt,
    restoreBackup,
    setEditingMessage,
    clearEditingMessage,
    dismissBackupPrompt,
    fetchSettings,
    updateSettings,
    fetchMotionStatus,
    fetchMotionGrid,
    fetchMotionLogs
  }
})
