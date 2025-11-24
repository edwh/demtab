# Demtab - Raspberry Pi Tablet Display System

A smart display system for Raspberry Pi that shows scheduled messages and integrates with phone call management.

## What Does This Do?

**Demtab** is an unattended display system designed for a Raspberry Pi with touchscreen. It shows customizable messages based on time and day schedules, with special integration for managing frequent phone calls.

### Display Features
- Shows messages in **fullscreen** with adaptive font sizing
- **Time-based scheduling** - messages appear only during specified times/days
- **Real-time clock** with day of week and time period (Morning, Afternoon, Evening, etc.)
- **Color-coded messages** with optional gentle cycling colors (soft pastel transitions)
- **Auto-rotate to landscape** - CSS-based rotation for portrait displays
- **Hidden cursor** - Clean kiosk appearance
- **Night mode** - Configurable hours when screen blanks to save power/reduce light
- **PIR motion detection** - Optional wake-on-motion during night mode (tap screen to wake if no PIR)
- Automatically refreshes every 30 seconds

### Admin Interface
Access the admin panel at `http://[pi-address]:8080` to manage everything:

#### Messages Tab
- Add, edit, and delete messages
- Set display times and days of the week
- Choose text colors
- Enable flash/cycle color effect
- Drag and drop to reorder messages

#### Phone Tab
- **Call Throttle** - If enabled, detects recent calls (via [AnswerBot](https://github.com/edwh/answerbot-server) API)
- Shows a "please wait before calling again" message if someone called recently
- Configurable time window (e.g., 30 minutes)
- Customizable throttle message

#### Settings Tab
- **Night Mode** - Configure start/end times for screen blanking
- **Motion Detection** - Enable PIR sensor wake feature
- **Motion Timeout** - How long to stay awake after motion detected

#### Backups Tab
- Download backup of all messages (JSON format)
- Restore from backup file
- Automatic 24-hour backup reminders

## Tech Stack

- **Backend**: Node.js, Express, SQLite
- **Frontend**: Nuxt 3, Vue 3, Bootstrap Vue Next, Pinia
- **Display**: Chromium in kiosk mode, CSS-based landscape orientation, hidden cursor
- **Auto-start**: Systemd service + desktop autostart

## Quick Setup

```bash
# Install dependencies
npm install
cd admin && npm install && cd ..
cd display && npm install && cd ..

# Build frontend applications
npm run build

# Configure environment
cp .env.example .env
# Edit .env and add your ANSWERBOT_API_KEY

# Set up and start the service
sudo cp pi-display.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable pi-display.service
sudo systemctl start pi-display.service

# Development mode
npm run dev           # Backend server (ports 80 & 8080)
npm run dev:admin     # Admin interface dev server
npm run dev:display   # Display interface dev server
```

See [SETUP.md](SETUP.md) for complete Raspberry Pi installation instructions including display rotation and browser autostart.

## Access Points

- **Display**: `http://[pi-address]:80`
- **Admin Panel**: `http://[pi-address]:8080`

## Key Features

- **Schedule-based messaging** - Show different messages at different times
- **Call throttle integration** - Prevent notification fatigue from frequent calls
- **Easy admin interface** - No technical knowledge required
- **Night mode** - Screen blanks during configured hours
- **PIR motion detection** - Wake screen on movement
- **Backup & restore** - Never lose your messages
- **Fullscreen kiosk mode** - Dedicated display with no distractions
- **Auto-start on boot** - Always running, no manual startup
- **Database migrations** - Smooth updates and upgrades

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

- `ANSWERBOT_API_KEY` - Your AnswerBot API key for call throttle feature

### Remote Administration with Tailscale

For secure remote access to your Raspberry Pi, install [Tailscale](https://tailscale.com/):

```bash
# Install Tailscale on Raspberry Pi
curl -fsSL https://tailscale.com/install.sh | sh

# Authenticate and connect
sudo tailscale up

# Get your Tailscale IP address
tailscale ip -4
```

Once connected, you can access the admin interface from anywhere using your Tailscale IP:

- **Admin Panel**: `http://[tailscale-ip]:8080`
- **Display**: `http://[tailscale-ip]:80`

Tailscale provides encrypted, peer-to-peer connections without exposing your Pi to the public internet or requiring port forwarding.

### Service Management

```bash
# Start/stop/restart the service
sudo systemctl start pi-display
sudo systemctl stop pi-display
sudo systemctl restart pi-display

# View logs
sudo journalctl -u pi-display.service -f
```

### Motion Sensor Monitoring

```bash
# Real-time PIR status (requires jq)
watch -n 1 'curl -s http://localhost:80/api/motion | jq'

# Without jq
watch -n 1 'curl -s http://localhost:80/api/motion'

# Simulate motion (for testing)
curl -X POST http://localhost:80/api/motion/simulate
```

## Project Structure

```
/var/www/demtab/
├── server/                      # Backend API
│   ├── api.js                  # API routes
│   ├── db.js                   # Database management
│   ├── index.js                # Express server
│   ├── pir.js                  # PIR motion sensor driver
│   ├── screen.js               # Screen control (DPMS)
│   └── migrations/             # Database migrations
├── admin/                       # Admin interface (Nuxt 3)
│   ├── app.vue                 # Main admin UI with tabs
│   └── stores/messages.ts      # Pinia state management
├── display/                     # Display interface (Nuxt 3)
│   ├── app.vue                 # Display UI with clock
│   └── stores/messages.ts      # Pinia state management
├── .env                         # Environment config (not in git)
├── .env.example                 # Example environment config
├── SETUP.md                     # Raspberry Pi setup guide
└── README.md                    # This file
```

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

---

**Reference Implementation**: Based on patterns from [Freegle/iznik-nuxt3](https://github.com/Freegle/iznik-nuxt3)
