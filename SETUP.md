# Raspberry Pi Display System - Setup Guide

This system provides an unattended display for showing configurable messages on a Raspberry Pi with a touchscreen.

## Overview

The system consists of:
- **Display Interface** (port 80): Full-screen message display with auto-refresh
- **Admin Interface** (port 8080): Web-based configuration panel
- **Backend Server**: Node.js Express server with SQLite database
- **Auto-start**: Automatic browser launch on boot in kiosk mode

## Features

### Display Interface
- Black background optimized for visibility
- Adaptive font sizing to fit all messages on screen
- Title bar showing:
  - Day of week
  - Time (12-hour format with AM/PM)
  - Time period (Morning/Lunchtime/Afternoon/Evening/Night)
- Auto-refresh every 30 seconds
- Color-cycling for messages marked as "flash"

### Admin Interface
- Add, edit, and delete messages
- Configure message properties:
  - Text content
  - Text color with color picker
  - Enable/disable toggle
  - Flash/color-cycle toggle
  - Time of day range (start/end times)
  - Days of week selection
- Drag-and-drop message reordering
- Backup and restore functionality:
  - Download backup as JSON file (named with hostname and timestamp)
  - Restore from backup file
  - Automatic backup reminder (max once per 24 hours)

## Initial Raspberry Pi Setup

### 1. Install Raspberry Pi OS

1. Download and install Raspberry Pi Imager from https://www.raspberrypi.com/software/
2. Flash Raspberry Pi OS (Desktop version) to your SD card
3. Boot your Raspberry Pi and complete the initial setup wizard

### 2. Configure System Settings

#### Configure Display Settings

Edit the config file:
```bash
sudo nano /boot/firmware/config.txt
```

Add the following lines:
```
# Disable touchscreen
disable_touchscreen=1

# Rotate display to landscape (choose one):
# display_rotate=0  # Normal (default)
# display_rotate=1  # 90 degrees clockwise
# display_rotate=2  # 180 degrees
# display_rotate=3  # 270 degrees (90 degrees counterclockwise)

# For landscape on official 7" touchscreen, typically use:
display_rotate=3
```

Save and exit (Ctrl+X, Y, Enter)

**Note**: The display app also includes CSS-based landscape rotation as a fallback.

#### Disable On-Screen Keyboard

```bash
sudo raspi-config
```

Navigate to:
- Display Options → Screen Keyboard → Off
- Select OK and exit

### 3. Install Node.js 24

Install Node.js 24.x:
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version  # Should show v24.x.x
npm --version
```

### 4. Install System Dependencies

```bash
sudo apt-get update
sudo apt-get install -y build-essential chromium-browser
```

## Application Installation

### 1. Clone or Copy Project Files

Ensure all project files are in `/var/www/`:
```bash
cd /var/www
```

### 2. Install Dependencies

Install root dependencies:
```bash
npm install
```

Install admin app dependencies:
```bash
cd admin
npm install
cd ..
```

Install display app dependencies:
```bash
cd display
npm install
cd ..
```

### 3. Build Frontend Applications

Build both Nuxt3 apps:
```bash
npm run build
```

This will generate static files in:
- `/var/www/admin/.output/public/`
- `/var/www/display/.output/public/`

### 4. Set Up Systemd Service

Copy the service file:
```bash
sudo cp pi-display.service /etc/systemd/system/
```

Reload systemd:
```bash
sudo systemctl daemon-reload
```

Enable the service to start on boot:
```bash
sudo systemctl enable pi-display.service
```

Start the service:
```bash
sudo systemctl start pi-display.service
```

Check service status:
```bash
sudo systemctl status pi-display.service
```

View logs:
```bash
sudo journalctl -u pi-display.service -f
```

### 5. Set Up Browser Auto-Start

Make the launch script executable:
```bash
chmod +x launch-display.sh
```

Create autostart directory if it doesn't exist:
```bash
mkdir -p ~/.config/autostart
```

Copy the desktop file:
```bash
cp pi-display.desktop ~/.config/autostart/
```

### 6. Configure Permissions for Port 80

To run the server on port 80 without sudo, grant Node.js permission:
```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

## Testing

### 1. Test the Server

Check if the server is running:
```bash
curl http://localhost:80
curl http://localhost:8080
```

### 2. Access Admin Interface

From another device on the same network:
```
http://<raspberry-pi-ip>:8080
```

From the Pi itself:
```
http://localhost:8080
```

### 3. Test Display

Open a browser on the Pi and navigate to:
```
http://localhost:80
```

### 4. Test Auto-Start

Reboot the Raspberry Pi:
```bash
sudo reboot
```

The display should automatically launch in fullscreen mode after boot.

## Usage

### Managing Messages

1. Access the admin interface at `http://localhost:8080` or `http://<pi-ip>:8080`
2. Add messages using the form at the top
3. Configure each message:
   - Enter text content
   - Choose a color
   - Set time range (when the message should display)
   - Select days of week
   - Enable/disable the message
   - Toggle flash effect for attention
4. Drag messages to reorder them
5. Edit or delete existing messages

### Backup and Restore

#### Create Backup
1. Access the admin interface
2. Click "Download Backup" button
3. Save the JSON file (named with hostname and date)
4. Store this file safely

#### Restore Backup
1. Access the admin interface
2. Click "Restore from Backup"
3. Select your backup JSON file
4. Confirm the restore operation

The system will automatically prompt you to download a backup once every 24 hours when you access the admin interface.

## Troubleshooting

### Server Won't Start

Check the service logs:
```bash
sudo journalctl -u pi-display.service -n 50
```

Verify Node.js version:
```bash
node --version  # Should be v24.x.x
```

### Browser Doesn't Auto-Launch

Check if the autostart file exists:
```bash
ls ~/.config/autostart/pi-display.desktop
```

Check the launch script:
```bash
cat /var/www/launch-display.sh
```

Manually test the launch script:
```bash
bash /var/www/launch-display.sh
```

### Port 80 Permission Denied

Re-run the setcap command:
```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
```

Or run the server on a different port by modifying `/var/www/server/index.js`.

### Display Not Showing Messages

1. Check if messages are configured in the admin interface
2. Verify the messages are enabled
3. Check if the current time and day match the message schedules
4. Open browser console (F12) to check for errors

### Database Issues

The database file is located at `/var/www/messages.db`.

To reset the database:
```bash
sudo systemctl stop pi-display.service
rm /var/www/messages.db
sudo systemctl start pi-display.service
```

The database will be recreated with migrations on next start.

## Database Migrations

The system includes a migration system for database changes.

Migration files are located in `/var/www/server/migrations/` and are named with the format:
```
001_description.sql
002_another_change.sql
```

Migrations are automatically applied on server startup in numerical order.

To add a new migration:
1. Create a new `.sql` file in `/var/www/server/migrations/`
2. Name it with the next number in sequence
3. Write your SQL commands
4. Restart the server

Example migration file (`002_add_priority.sql`):
```sql
ALTER TABLE messages ADD COLUMN priority INTEGER DEFAULT 0;
```

## Maintenance

### Restart Server
```bash
sudo systemctl restart pi-display.service
```

### Stop Server
```bash
sudo systemctl stop pi-display.service
```

### Update Application

1. Stop the service:
```bash
sudo systemctl stop pi-display.service
```

2. Update code (pull from git, copy new files, etc.)

3. Rebuild frontend apps:
```bash
cd /var/www
npm run build
```

4. Start the service:
```bash
sudo systemctl start pi-display.service
```

### Regular Backups

Set up a cron job for automatic backups:
```bash
crontab -e
```

Add a line to backup daily at 2 AM:
```
0 2 * * * curl http://localhost:8080/api/backup/download -o ~/backups/backup-$(date +\%Y\%m\%d).json
```

## System Requirements

- Raspberry Pi (3, 4, or 5 recommended)
- Touchscreen display
- Raspberry Pi OS (Desktop version)
- Node.js 24.x
- 8GB+ SD card
- Network connection (for remote admin access)

## Port Usage

- **Port 80**: Display interface (requires special permissions)
- **Port 8080**: Admin interface and API
- **Port 3000**: Admin development server (only during development)
- **Port 3001**: Display development server (only during development)

## File Structure

```
/var/www/
├── package.json                 # Root package.json
├── server/                      # Backend server
│   ├── index.js                # Main server file
│   ├── api.js                  # API functions
│   ├── db.js                   # Database setup and migrations
│   └── migrations/             # Database migration files
│       └── 001_initial_schema.sql
├── admin/                       # Admin Nuxt3 app
│   ├── package.json
│   ├── nuxt.config.ts
│   ├── app.vue
│   └── .output/                # Generated files (after build)
├── display/                     # Display Nuxt3 app
│   ├── package.json
│   ├── nuxt.config.ts
│   ├── app.vue
│   └── .output/                # Generated files (after build)
├── messages.db                  # SQLite database (created on first run)
├── pi-display.service          # Systemd service file
├── launch-display.sh           # Browser launch script
├── pi-display.desktop          # Autostart desktop entry
└── SETUP.md                    # This file
```

## Security Notes

- The admin interface has **no authentication** as specified
- It's recommended to use this on a private/isolated network
- Port 8080 should not be exposed to the internet
- For production use with internet exposure, consider adding authentication
- The database file is not encrypted

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs: `sudo journalctl -u pi-display.service -f`
3. Check browser console for frontend errors (F12)

## Development

### Running in Development Mode

Terminal 1 - Start backend:
```bash
npm run dev
```

Terminal 2 - Start admin dev server:
```bash
npm run dev:admin
```

Terminal 3 - Start display dev server:
```bash
npm run dev:display
```

Access:
- Admin: http://localhost:3001
- Display: http://localhost:3000
- API: http://localhost:80 and http://localhost:8080

### Making Changes

1. Edit source files in `/var/www/admin/` or `/var/www/display/`
2. The dev servers will auto-reload
3. When ready, rebuild for production: `npm run build`
4. Restart the service: `sudo systemctl restart pi-display.service`
