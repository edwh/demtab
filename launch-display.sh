#!/bin/bash

# Wait for the display server to be ready
sleep 5

# Wait for the server to be ready
while ! curl -s http://localhost:80 > /dev/null; do
  echo "Waiting for display server..."
  sleep 2
done

# Launch Chromium in kiosk mode
chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-features=TranslateUI \
  --no-first-run \
  --check-for-update-interval=31536000 \
  http://localhost:80
