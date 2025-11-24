<template>
  <div class="admin-container">
    <!-- Toast Notification -->
    <div v-if="showToast" class="toast-container">
      <BAlert :variant="toastVariant" show dismissible @dismissed="showToast = false">
        {{ toastMessage }}
      </BAlert>
    </div>

    <!-- Navbar -->
    <BNavbar class="custom-navbar px-3">
      <BNavbarBrand class="navbar-brand-custom"><strong>Tablet Admin</strong></BNavbarBrand>
      <!-- Motion Status Indicator -->
      <div v-if="store.motionStatus.pirAvailable" class="motion-indicator mx-3">
        <span class="motion-dot" :class="{ active: store.motionStatus.motionDetected }"></span>
        <span class="motion-text">
          {{ store.motionStatus.motionDetected ? 'Motion' : 'No Motion' }}
          <small v-if="lastMotionFormatted" class="motion-time">{{ lastMotionFormatted }}</small>
        </span>
      </div>
      <BNav pills class="ms-auto nav-pills-custom">
        <BNavItem
          :active="activeTab === 'messages'"
          @click="activeTab = 'messages'"
          class="nav-item-custom"
        >
          Messages
        </BNavItem>
        <BNavItem
          :active="activeTab === 'settings'"
          @click="activeTab = 'settings'"
          class="nav-item-custom"
        >
          Settings
        </BNavItem>
        <BNavItem
          :active="activeTab === 'backups'"
          @click="activeTab = 'backups'"
          class="nav-item-custom"
        >
          Backups
        </BNavItem>
        <BNavItem
          :active="activeTab === 'motion-stats'"
          @click="activeTab = 'motion-stats'; loadMotionStats()"
          class="nav-item-custom"
        >
          Motion Stats
        </BNavItem>
      </BNav>
    </BNavbar>

    <BContainer fluid class="py-4">
      <BRow>
        <BCol>
          <!-- Messages Tab -->
          <div v-if="activeTab === 'messages'">
            <!-- Add Message Button -->
            <div class="mb-4">
              <BButton variant="success" size="lg" @click="openAddModal">
                Add New Message
              </BButton>
            </div>

            <!-- Messages List -->
            <BCard>
              <BCardTitle>Messages (Drag to reorder) - Count: {{ store.messages.length }}</BCardTitle>
            <BCardBody>
              <div v-if="store.messages.length === 0" class="text-muted">
                No messages yet. Add one above.
              </div>
              <div v-else>
                <!-- Temporary: Testing without draggable -->
                <BCard
                  v-for="element in store.messages"
                  :key="element.id"
                  class="mb-3 message-card"
                >
                  <BCardBody>
                    <div class="d-flex align-items-start gap-3">
                      <div class="drag-handle" style="cursor: move; font-size: 1.5em;">
                        ☰
                      </div>
                      <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                          <div class="flex-grow-1">
                            <div class="mb-2 d-flex align-items-start gap-2">
                              <div
                                class="color-swatch"
                                :style="{ backgroundColor: element.color }"
                                :title="`Color: ${element.color}`"
                              ></div>
                              <div style="fontSize: 1.1em; fontWeight: bold; color: #212529;">
                                {{ element.text }}
                              </div>
                            </div>
                            <small class="text-muted">
                              <strong>Schedule:</strong> {{ element.time_start }} - {{ element.time_end }} | {{ element.days }}
                            </small>
                          </div>
                          <div class="d-flex gap-2 flex-shrink-0 ms-3 flex-wrap">
                            <BBadge :variant="element.enabled ? 'success' : 'secondary'">
                              {{ element.enabled ? 'Enabled' : 'Disabled' }}
                            </BBadge>
                            <BBadge v-if="element.flash" variant="warning">
                              Flash
                            </BBadge>
                            <BBadge v-if="element.motion_activated" variant="info">
                              Motion
                            </BBadge>
                            <BBadge v-if="element.display_mode === 'daytime'" variant="light" class="text-dark">
                              Day Only
                            </BBadge>
                            <BBadge v-if="element.display_mode === 'nighttime'" variant="dark">
                              Night Only
                            </BBadge>
                          </div>
                        </div>
                        <div class="d-flex gap-2">
                          <BButton size="sm" variant="primary" @click="editMessage(element)">
                            Edit
                          </BButton>
                          <BButton size="sm" variant="danger" @click="handleDeleteMessage(element.id)">
                            Delete
                          </BButton>
                        </div>
                      </div>
                    </div>
                  </BCardBody>
                </BCard>
              </div>
            </BCardBody>
          </BCard>
          </div>

          <!-- Settings Tab -->
          <div v-if="activeTab === 'settings'">
            <!-- Night Time Settings -->
            <BCard class="mb-4">
              <BCardTitle>Night Time Settings</BCardTitle>
              <BCardBody>
                <p class="text-muted">
                  Configure when night time begins and ends. During night time, only messages
                  configured for nighttime or both will display. The screen will turn off if
                  there are no messages to show.
                </p>

                <BRow class="mb-3">
                  <BCol md="6">
                    <BFormGroup label="Night Starts At" label-for="night-start">
                      <BFormInput
                        id="night-start"
                        v-model="nightStart"
                        type="time"
                      />
                    </BFormGroup>
                  </BCol>
                  <BCol md="6">
                    <BFormGroup label="Night Ends At" label-for="night-end">
                      <BFormInput
                        id="night-end"
                        v-model="nightEnd"
                        type="time"
                      />
                    </BFormGroup>
                  </BCol>
                </BRow>

                <BButton variant="primary" @click="saveSettings">
                  Save Night Time Settings
                </BButton>
              </BCardBody>
            </BCard>

            <!-- Call Throttle Settings -->
            <BCard>
              <BCardTitle>Call Throttle Settings</BCardTitle>
              <BCardBody>
                <p class="text-muted">
                  When enabled, if there has been a recent call within the specified time window,
                  the display will show a throttle message instead of regular messages.
                </p>

                <BFormGroup label-class="fw-bold">
                  <BFormCheckbox v-model="throttleEnabled" switch size="lg" class="mb-3">
                    Enable Call Throttle
                  </BFormCheckbox>
                </BFormGroup>

                <BFormGroup label="Minutes Since Last Call" label-for="throttle-minutes" class="mb-3">
                  <BFormInput
                    id="throttle-minutes"
                    v-model="throttleMinutes"
                    type="number"
                    min="1"
                    max="120"
                    :disabled="!throttleEnabled"
                  />
                  <small class="text-muted">Show throttle message if call was within this many minutes</small>
                </BFormGroup>

                <BFormGroup label="Throttle Message" label-for="throttle-message" class="mb-3">
                  <BFormTextarea
                    id="throttle-message"
                    v-model="throttleMessage"
                    rows="3"
                    :disabled="!throttleEnabled"
                  />
                </BFormGroup>

                <BButton variant="primary" @click="saveSettings">
                  Save Call Throttle Settings
                </BButton>
              </BCardBody>
            </BCard>
          </div>

          <!-- Backups Tab -->
          <div v-if="activeTab === 'backups'">
            <BCard>
              <BCardTitle>Backup & Restore</BCardTitle>
              <BCardBody>
                <p class="text-muted mb-4">
                  Download a backup of all your messages or restore from a previous backup file.
                </p>
                <div class="d-flex gap-2">
                  <BButton variant="primary" size="lg" @click="handleDownloadBackup">
                    Download Backup
                  </BButton>
                  <BButton variant="warning" size="lg" @click="$refs.fileInput.click()">
                    Restore from Backup
                  </BButton>
                  <input
                    ref="fileInput"
                    type="file"
                    accept=".json"
                    style="display: none"
                    @change="handleFileUpload"
                  />
                </div>
              </BCardBody>
            </BCard>
          </div>

          <!-- Motion Stats Tab -->
          <div v-if="activeTab === 'motion-stats'">
            <BCard>
              <BCardTitle>Motion-Activated Message Display History</BCardTitle>
              <BCardBody>
                <p class="text-muted mb-3">
                  This grid shows when motion-activated messages were displayed. Each cell represents a 15-minute interval.
                  Green = no displays, Red = displayed (darker red = more displays).
                </p>

                <div class="mb-3">
                  <BFormGroup label="Time Period" label-for="weeks-select">
                    <BFormSelect id="weeks-select" v-model="weeksBack" @change="loadMotionStats" style="max-width: 200px;">
                      <option :value="1">Last 1 week</option>
                      <option :value="2">Last 2 weeks</option>
                      <option :value="4">Last 4 weeks</option>
                      <option :value="8">Last 8 weeks</option>
                    </BFormSelect>
                  </BFormGroup>
                </div>

                <!-- Grid Visualization -->
                <div class="motion-grid-container">
                  <!-- Time labels (columns) -->
                  <div class="time-labels">
                    <div class="day-label-spacer"></div>
                    <div v-for="hour in 24" :key="hour" class="time-label">
                      {{ (hour - 1).toString().padStart(2, '0') }}
                    </div>
                  </div>

                  <!-- Grid rows (days) -->
                  <div v-for="(dayName, dayIndex) in dayNames" :key="dayIndex" class="grid-row">
                    <div class="day-label">{{ dayName }}</div>
                    <div class="grid-cells">
                      <div
                        v-for="slot in 96"
                        :key="slot"
                        class="grid-cell"
                        :style="getCellStyle(dayIndex, slot - 1)"
                        :title="getCellTooltip(dayIndex, slot - 1)"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Legend -->
                <div class="legend mt-3">
                  <span class="legend-item">
                    <span class="legend-cell" style="background-color: #28a745;"></span>
                    No displays
                  </span>
                  <span class="legend-item">
                    <span class="legend-cell" style="background-color: #ffc107;"></span>
                    Few displays
                  </span>
                  <span class="legend-item">
                    <span class="legend-cell" style="background-color: #dc3545;"></span>
                    Many displays
                  </span>
                </div>
              </BCardBody>
            </BCard>
          </div>
        </BCol>
      </BRow>
    </BContainer>

    <!-- Add/Edit Message Modal -->
    <BModal v-model="showMessageModal" :title="store.editingMessage ? 'Edit Message' : 'Add New Message'" size="lg">
      <BForm id="messageForm" @submit.prevent="saveMessage">
        <BFormGroup label="Message Text" label-for="text-input" class="mb-3">
          <BFormTextarea
            id="text-input"
            v-model="form.text"
            placeholder="Enter message text"
            rows="3"
            required
          />
        </BFormGroup>

        <BRow class="mb-3">
          <BCol md="6">
            <BFormGroup label="Text Color" label-for="color-input">
              <div class="d-flex gap-2 align-items-center">
                <input
                  id="color-input"
                  v-model="form.color"
                  type="color"
                  class="form-control form-control-color"
                />
                <BFormInput
                  v-model="form.color"
                  placeholder="#FFFFFF"
                  style="max-width: 120px"
                />
              </div>
            </BFormGroup>
          </BCol>
          <BCol md="6">
            <BFormGroup>
              <div class="mt-4">
                <BFormCheckbox v-model="form.enabled" switch>
                  Enabled
                </BFormCheckbox>
                <BFormCheckbox v-model="form.flash" switch>
                  Flash/Cycle Colors
                </BFormCheckbox>
                <BFormCheckbox v-model="form.motion_activated" switch>
                  Motion Activated Only
                </BFormCheckbox>
              </div>
            </BFormGroup>
          </BCol>
        </BRow>

        <BRow class="mb-3">
          <BCol md="6">
            <BFormGroup label="Display Mode" label-for="display-mode">
              <BFormSelect id="display-mode" v-model="form.display_mode">
                <option value="both">Both (Day & Night)</option>
                <option value="daytime">Daytime Only</option>
                <option value="nighttime">Nighttime Only</option>
              </BFormSelect>
              <small class="text-muted">When should this message be shown?</small>
            </BFormGroup>
          </BCol>
        </BRow>

        <BRow class="mb-3">
          <BCol md="6">
            <BFormGroup label="Start Time" label-for="time-start">
              <BFormInput
                id="time-start"
                v-model="form.time_start"
                type="time"
              />
            </BFormGroup>
          </BCol>
          <BCol md="6">
            <BFormGroup label="End Time" label-for="time-end">
              <BFormInput
                id="time-end"
                v-model="form.time_end"
                type="time"
              />
            </BFormGroup>
          </BCol>
        </BRow>

        <BFormGroup label="Days of Week" class="mb-3">
          <div class="d-flex gap-2 flex-wrap">
            <BFormCheckbox
              v-for="day in daysOfWeek"
              :key="day"
              v-model="form.selectedDays"
              :value="day"
              button
              button-variant="outline-primary"
            >
              {{ day }}
            </BFormCheckbox>
          </div>
        </BFormGroup>
      </BForm>

      <template #footer>
        <div class="d-flex gap-2 justify-content-end w-100">
          <BButton variant="secondary" @click="closeMessageModal">
            Cancel
          </BButton>
          <BButton variant="success" @click="saveMessage">
            {{ store.editingMessage ? 'Update Message' : 'Add Message' }}
          </BButton>
        </div>
      </template>
    </BModal>

    <!-- Backup Prompt Modal -->
    <BModal v-model="store.showBackupPrompt" title="Backup Reminder">
      <p>It's been more than 24 hours since your last backup reminder.</p>
      <p>Would you like to download a backup of your messages?</p>

      <template #footer>
        <div class="d-flex gap-2 justify-content-end w-100">
          <BButton variant="secondary" @click="dismissBackupPrompt">
            Not Now
          </BButton>
          <BButton variant="primary" @click="downloadBackupFromPrompt">
            Download Backup
          </BButton>
        </div>
      </template>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { VueDraggableNext as draggable } from 'vue-draggable-next';
import {
  BContainer,
  BRow,
  BCol,
  BCard,
  BCardTitle,
  BCardBody,
  BButton,
  BForm,
  BFormGroup,
  BFormTextarea,
  BFormInput,
  BFormCheckbox,
  BFormSelect,
  BBadge,
  BModal,
  BNavbar,
  BNavbarBrand,
  BNav,
  BNavItem,
  BAlert
} from 'bootstrap-vue-next';
import { useMessagesStore } from '~/stores/messages';

const store = useMessagesStore();

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const activeTab = ref('messages');
const weeksBack = ref(4);
const showMessageModal = ref(false);

// Toast notifications
const showToast = ref(false);
const toastMessage = ref('');
const toastVariant = ref('success');

function showNotification(message, variant = 'success') {
  toastMessage.value = message;
  toastVariant.value = variant;
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

// Throttle settings
const throttleEnabled = computed({
  get: () => store.settings.call_throttle_enabled === '1',
  set: (value) => store.settings.call_throttle_enabled = value ? '1' : '0'
});

const throttleMinutes = computed({
  get: () => store.settings.call_throttle_minutes,
  set: (value) => store.settings.call_throttle_minutes = String(value)
});

const throttleMessage = computed({
  get: () => store.settings.call_throttle_message,
  set: (value) => store.settings.call_throttle_message = value
});

const nightStart = computed({
  get: () => store.settings.night_start || '22:00',
  set: (value) => store.settings.night_start = value
});

const nightEnd = computed({
  get: () => store.settings.night_end || '07:00',
  set: (value) => store.settings.night_end = value
});

const lastMotionFormatted = computed(() => {
  if (!store.motionStatus.lastMotionTime) return null;
  const date = new Date(store.motionStatus.lastMotionTime);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleTimeString();
});

const form = ref({
  text: '',
  color: '#FFFFFF',
  enabled: true,
  flash: false,
  time_start: '00:00',
  time_end: '23:59',
  selectedDays: [...daysOfWeek],
  display_mode: 'both',
  motion_activated: false
});

const fileInput = ref(null);

function openAddModal() {
  resetForm();
  showMessageModal.value = true;
}

function editMessage(message) {
  store.setEditingMessage(message);
  form.value = {
    text: message.text,
    color: message.color,
    enabled: message.enabled === 1,
    flash: message.flash === 1,
    time_start: message.time_start,
    time_end: message.time_end,
    selectedDays: message.days.split(','),
    display_mode: message.display_mode || 'both',
    motion_activated: message.motion_activated === 1
  };
  showMessageModal.value = true;
}

function closeMessageModal() {
  showMessageModal.value = false;
  resetForm();
}

async function saveMessage() {
  const data = {
    text: form.value.text,
    color: form.value.color,
    enabled: form.value.enabled ? 1 : 0,
    flash: form.value.flash ? 1 : 0,
    time_start: form.value.time_start,
    time_end: form.value.time_end,
    days: form.value.selectedDays.join(','),
    display_mode: form.value.display_mode,
    motion_activated: form.value.motion_activated ? 1 : 0
  };

  const isEditing = !!store.editingMessage;

  try {
    if (isEditing) {
      await store.updateMessage(store.editingMessage.id, data);
    } else {
      await store.createMessage(data);
    }

    closeMessageModal();
    showNotification(isEditing ? 'Message updated successfully' : 'Message added successfully');
  } catch (error) {
    showNotification('Failed to save message', 'danger');
  }
}

function resetForm() {
  store.clearEditingMessage();
  form.value = {
    text: '',
    color: '#FFFFFF',
    enabled: true,
    flash: false,
    time_start: '00:00',
    time_end: '23:59',
    selectedDays: [...daysOfWeek],
    display_mode: 'both',
    motion_activated: false
  };
}

async function handleDeleteMessage(id) {
  if (!confirm('Are you sure you want to delete this message?')) {
    return;
  }

  try {
    await store.deleteMessage(id);
    showNotification('Message deleted successfully');
  } catch (error) {
    showNotification('Failed to delete message', 'danger');
  }
}

async function updateOrder() {
  const orderedIds = store.messages.map(m => m.id);

  try {
    await store.reorderMessages(orderedIds);
    showNotification('Message order updated');
  } catch (error) {
    showNotification('Failed to update message order', 'danger');
  }
}

async function handleDownloadBackup() {
  try {
    await store.downloadBackup();
    showNotification('Backup downloaded successfully');
  } catch (error) {
    showNotification('Failed to download backup', 'danger');
  }
}

async function downloadBackupFromPrompt() {
  await handleDownloadBackup();
  await store.recordBackupPrompt();
  store.dismissBackupPrompt();
}

async function dismissBackupPrompt() {
  await store.recordBackupPrompt();
  store.dismissBackupPrompt();
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const backupData = JSON.parse(text);

    if (!confirm('This will replace all current messages. Are you sure?')) {
      return;
    }

    await store.restoreBackup(backupData);
    showNotification('Backup restored successfully');
  } catch (error) {
    showNotification('Failed to restore backup. Make sure the file is valid JSON.', 'danger');
  }

  // Reset file input
  event.target.value = '';
}

async function saveSettings() {
  try {
    await store.updateSettings(store.settings);
    showNotification('Settings saved successfully');
  } catch (error) {
    showNotification('Failed to save settings', 'danger');
  }
}

// Motion Stats functions
async function loadMotionStats() {
  await store.fetchMotionGrid(weeksBack.value);
}

function getCellStyle(dayIndex, slot) {
  const grid = store.motionGrid;
  const count = grid[dayIndex]?.[slot] || 0;

  if (count === 0) {
    return { backgroundColor: '#28a745' }; // Green for no displays
  }

  // Calculate intensity based on count (more red for more displays)
  // Max out at around 10 displays
  const intensity = Math.min(count / 10, 1);

  if (intensity < 0.3) {
    return { backgroundColor: '#ffc107' }; // Yellow for few
  } else if (intensity < 0.6) {
    return { backgroundColor: '#fd7e14' }; // Orange for some
  } else {
    return { backgroundColor: '#dc3545' }; // Red for many
  }
}

function getCellTooltip(dayIndex, slot) {
  const grid = store.motionGrid;
  const count = grid[dayIndex]?.[slot] || 0;
  const hour = Math.floor(slot / 4);
  const minute = (slot % 4) * 15;
  const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  const endMinute = minute + 14;
  const endTimeStr = `${hour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

  return `${dayNames[dayIndex]} ${timeStr}-${endTimeStr}: ${count} display${count !== 1 ? 's' : ''}`;
}

let motionPollInterval = null;

onMounted(async () => {
  await store.fetchMessages();
  await store.fetchSettings();
  await store.checkBackupPrompt();
  await store.fetchMotionStatus();

  // Poll motion status every 5 seconds
  motionPollInterval = setInterval(() => {
    store.fetchMotionStatus();
  }, 5000);
});

onUnmounted(() => {
  if (motionPollInterval) {
    clearInterval(motionPollInterval);
  }
});
</script>

<style scoped>
.admin-container {
  background-color: #f8f9fa;
  min-height: 100vh;
}

/* Toast Notification */
.toast-container {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 9999;
  min-width: 300px;
  max-width: 500px;
}

/* Custom Navbar Styling */
.custom-navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border-bottom: 3px solid #5568d3;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 12px 20px;
}

.navbar-brand-custom {
  font-size: 1.5rem;
  color: #ffffff !important;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
}

.nav-pills-custom :deep(.nav-link) {
  color: rgba(255, 255, 255, 0.85) !important;
  font-weight: 500;
  font-size: 1.1rem;
  padding: 8px 20px;
  margin: 0 4px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.nav-pills-custom :deep(.nav-link:hover) {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff !important;
}

.nav-pills-custom :deep(.nav-link.active) {
  background-color: rgba(255, 255, 255, 0.25) !important;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.message-card {
  transition: box-shadow 0.2s;
}

.message-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.drag-handle {
  user-select: none;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid #dee2e6;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Motion Status Indicator */
.motion-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.15);
  padding: 6px 12px;
  border-radius: 20px;
}

.motion-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #6c757d;
  transition: background-color 0.3s ease;
}

.motion-dot.active {
  background-color: #28a745;
  box-shadow: 0 0 8px #28a745;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(40, 167, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}

.motion-text {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  font-weight: 500;
}

.motion-time {
  display: block;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
}

/* Motion Stats Grid */
.motion-grid-container {
  overflow-x: auto;
  padding-bottom: 10px;
}

.time-labels {
  display: flex;
  margin-bottom: 4px;
}

.day-label-spacer {
  width: 50px;
  flex-shrink: 0;
}

.time-label {
  width: 32px;
  text-align: center;
  font-size: 0.7rem;
  color: #6c757d;
}

.grid-row {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
}

.day-label {
  width: 50px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #495057;
  flex-shrink: 0;
}

.grid-cells {
  display: flex;
  gap: 1px;
}

.grid-cell {
  width: 7px;
  height: 14px;
  border-radius: 1px;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.grid-cell:hover {
  transform: scale(1.5);
  z-index: 10;
  position: relative;
}

.legend {
  display: flex;
  gap: 20px;
  font-size: 0.85rem;
  color: #6c757d;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-cell {
  width: 14px;
  height: 14px;
  border-radius: 2px;
}
</style>
