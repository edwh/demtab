<template>
  <div class="display-container" :class="{ 'screen-off': store.screenOff }">
    <!-- Screen Off State - completely blank -->
    <div v-if="store.screenOff" class="screen-off-overlay" @click="wakeScreen">
      <!-- Intentionally blank to minimize screen glow -->
    </div>

    <!-- Normal Display -->
    <template v-else>
      <!-- Title Bar -->
      <div class="title-bar">
        <div class="day-of-week">{{ store.dayOfWeek }}</div>
        <div class="clock">{{ store.clockTime }}</div>
        <div class="time-period">{{ store.timePeriod }}</div>
      </div>

      <!-- Messages Display -->
      <div ref="messagesContainer" class="messages-container">
        <div
          v-for="(message, index) in store.messages"
          :key="message.id"
          class="message"
          :style="getMessageStyle(message, index)"
        >
          {{ message.text }}
        </div>
        <div v-if="store.messages.length === 0" class="no-messages">
          No messages to display
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useMessagesStore } from '~/stores/messages';

const store = useMessagesStore();

const messagesContainer = ref(null);
// Softer pastel colors for gentler transitions
const flashColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#87CEEB'];
const fontSize = ref(48);

let messageRefreshInterval = null;
let clockInterval = null;
let flashInterval = null;

function adjustFontSize() {
  if (!messagesContainer.value || store.messages.length === 0) {
    return;
  }

  const container = messagesContainer.value;
  const containerHeight = container.clientHeight;
  const containerWidth = container.clientWidth;

  // Start with a large font size and reduce until it fits
  let testSize = 100;
  fontSize.value = testSize;

  // Create a temporary element to measure text
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.visibility = 'hidden';
  tempDiv.style.width = `${containerWidth}px`;
  tempDiv.style.padding = '20px';
  document.body.appendChild(tempDiv);

  while (testSize > 10) {
    tempDiv.style.fontSize = `${testSize}px`;
    tempDiv.style.lineHeight = '1.2';

    // Measure all messages
    let totalHeight = 0;
    store.messages.forEach((message, index) => {
      tempDiv.textContent = message.text;
      totalHeight += tempDiv.offsetHeight;
      if (index < store.messages.length - 1) {
        totalHeight += 20; // Gap between messages
      }
    });

    if (totalHeight <= containerHeight - 40) { // 40px for padding
      fontSize.value = testSize;
      break;
    }

    testSize -= 2;
  }

  document.body.removeChild(tempDiv);
}

function getMessageStyle(message, index) {
  const baseStyle = {
    fontSize: `${fontSize.value}px`,
    lineHeight: '1.2',
    marginBottom: index < store.messages.length - 1 ? '20px' : '0'
  };

  if (message.flash) {
    return {
      ...baseStyle,
      color: flashColors[store.currentFlashIndex % flashColors.length]
    };
  } else {
    return {
      ...baseStyle,
      color: message.color
    };
  }
}

// Wake screen on touch/click (simulates motion detection)
async function wakeScreen() {
  try {
    // Simulate motion to wake the display
    await fetch(`${store.apiBase}/motion/simulate`, { method: 'POST' });
    // Force refresh messages
    await store.fetchMessages();
  } catch (error) {
    console.error('Error waking screen:', error);
  }
}

async function onFetchMessages() {
  await store.fetchMessages();
  await nextTick();
  adjustFontSize();
}

onMounted(() => {
  // Connect SSE for real-time screen wake notifications
  store.connectSSE();

  // Initial fetch
  onFetchMessages();

  // Refresh messages every 30 seconds (fallback for SSE)
  messageRefreshInterval = setInterval(onFetchMessages, 30000);

  // Update clock every second
  clockInterval = setInterval(store.updateClock, 1000);

  // Cycle flash colors every 1500ms for gentler transitions
  flashInterval = setInterval(store.cycleFlashColors, 1500);

  // Adjust font size on window resize
  window.addEventListener('resize', adjustFontSize);
});

onBeforeUnmount(() => {
  // Disconnect SSE
  store.disconnectSSE();

  if (messageRefreshInterval) {
    clearInterval(messageRefreshInterval);
  }
  if (clockInterval) {
    clearInterval(clockInterval);
  }
  if (flashInterval) {
    clearInterval(flashInterval);
  }
  window.removeEventListener('resize', adjustFontSize);
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  cursor: none;
}

.display-container {
  width: 100vw;
  height: 100vh;
  background-color: #000000;
  color: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  /* Force landscape orientation */
  @media (orientation: portrait) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: rotate(90deg) translate(-50%, -50%);
    transform-origin: 0 0;
    width: 100vh;
    height: 100vw;
  }
}

.title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background-color: #1a1a1a;
  border-bottom: 2px solid #333;
  font-size: 24px;
  font-weight: bold;
}

.day-of-week,
.clock,
.time-period {
  flex: 1;
}

.day-of-week {
  text-align: left;
}

.clock {
  text-align: center;
  font-size: 28px;
}

.time-period {
  text-align: right;
}

.messages-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: hidden;
}

.message {
  text-align: center;
  font-weight: bold;
  word-wrap: break-word;
  max-width: 100%;
  transition: color 1s ease-in-out;
}

.no-messages {
  font-size: 32px;
  color: #666;
  font-style: italic;
}

/* Screen off state - minimize light output */
.screen-off {
  background-color: #000000 !important;
}

.screen-off-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background-color: #000000;
  z-index: 9999;
  cursor: none;
}
</style>
