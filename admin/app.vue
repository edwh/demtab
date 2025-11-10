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
      <BNav pills class="ms-auto nav-pills-custom">
        <BNavItem
          :active="activeTab === 'messages'"
          @click="activeTab = 'messages'"
          class="nav-item-custom"
        >
          Messages
        </BNavItem>
        <BNavItem
          :active="activeTab === 'phone'"
          @click="activeTab = 'phone'"
          class="nav-item-custom"
        >
          Phone
        </BNavItem>
        <BNavItem
          :active="activeTab === 'backups'"
          @click="activeTab = 'backups'"
          class="nav-item-custom"
        >
          Backups
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
                          <div class="d-flex gap-2 flex-shrink-0 ms-3">
                            <BBadge :variant="element.enabled ? 'success' : 'secondary'">
                              {{ element.enabled ? 'Enabled' : 'Disabled' }}
                            </BBadge>
                            <BBadge v-if="element.flash" variant="warning">
                              Flash
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

          <!-- Phone Tab -->
          <div v-if="activeTab === 'phone'">
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
                  Save Settings
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
              </div>
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
          <BButton type="submit" form="messageForm" variant="success">
            {{ store.editingMessage ? 'Update Message' : 'Add Message' }}
          </BButton>
        </div>
      </template>
    </BModal>

    <!-- Backup Prompt Modal -->
    <BModal v-model="store.showBackupPrompt" title="Backup Reminder" hide-footer>
      <p>It's been more than 24 hours since your last backup reminder.</p>
      <p>Would you like to download a backup of your messages?</p>
      <div class="d-flex gap-2 justify-content-end">
        <BButton variant="secondary" @click="dismissBackupPrompt">
          Not Now
        </BButton>
        <BButton variant="primary" @click="downloadBackupFromPrompt">
          Download Backup
        </BButton>
      </div>
    </BModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
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

const activeTab = ref('messages');
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

const form = ref({
  text: '',
  color: '#FFFFFF',
  enabled: true,
  flash: false,
  time_start: '00:00',
  time_end: '23:59',
  selectedDays: [...daysOfWeek]
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
    selectedDays: message.days.split(',')
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
    days: form.value.selectedDays.join(',')
  };

  try {
    if (store.editingMessage) {
      await store.updateMessage(store.editingMessage.id, data);
    } else {
      await store.createMessage(data);
    }

    closeMessageModal();
    showNotification(store.editingMessage ? 'Message updated successfully' : 'Message added successfully');
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
    selectedDays: [...daysOfWeek]
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

onMounted(async () => {
  await store.fetchMessages();
  await store.fetchSettings();
  await store.checkBackupPrompt();
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
</style>
