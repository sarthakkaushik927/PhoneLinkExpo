# 📱 PhoneLink — Phone ↔ PC Call Bridge

> Control your Android phone's calls directly from your PC over Wi-Fi.  
> Accept, reject, dial, and route audio between your phone earpiece, speaker, or Bluetooth headset — all from a desktop WebSocket server.

---

## 📁 Project Structure

```
Calling app/
├── PhoneLinkExpo/          # React Native (Expo) mobile app
│   ├── src/
│   │   ├── screens/        # UI screens (HomeScreen, etc.)
│   │   ├── hooks/          # useSocket, useServerConfig, useRealCallDetection, etc.
│   │   ├── services/       # UDP auto-discovery service
│   │   ├── components/     # Reusable UI components
│   │   ├── config/         # Server IP/port config
│   │   └── constants/      # Colors, etc.
│   ├── android/            # Native Android project
│   └── server/             # Python WebSocket server (runs on PC)
│       ├── main.py         # Server entry point
│       ├── requirements.txt
│       ├── .env.example    # Environment variable template
│       └── app/            # Server modules (server.py, discovery.py, handlers/, etc.)
└── README.md
```

---

## ⚙️ Prerequisites

Before starting, make sure you have the following installed:

| Requirement | Minimum Version | Notes |
|---|---|---|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **Python** | 3.10+ | [python.org](https://python.org) |
| **Android Studio** | Latest | Required for Android SDK and ADB |
| **Java (JDK)** | 17+ | Required by Android Gradle |
| **Expo CLI** | Latest | `npm install -g expo-cli` |

> **Android Device**: A physical Android phone is required (not an emulator) because native Telephony APIs for call detection and audio routing do not work in emulators.

---

## 🖥️ Part 1 — Start the Python Server (PC)

The server runs on your PC and communicates with the phone over your local Wi-Fi network via WebSockets and UDP.

### Step 1.1 — Navigate to the server directory

```bash
cd "Calling app/PhoneLinkExpo/server"
```

### Step 1.2 — Create and activate a Python virtual environment

```bash
# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 1.3 — Install Python dependencies

```bash
pip install -r requirements.txt
```

This installs:
- `websockets` — WebSocket server
- `python-dotenv` — reads `.env` configuration
- `colorlog` — colourful terminal logging

### Step 1.4 — Configure the environment

Copy the example environment file and edit it:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Open `.env` and verify the settings:

```env
HOST=0.0.0.0      # Bind to all LAN interfaces (do not change)
PORT=8765         # WebSocket port — must match the mobile app config
ACCEPT_DELAY=3    # Seconds before auto-accepting a call (simulated)
LOG_LEVEL=INFO    # DEBUG | INFO | WARNING | ERROR | CRITICAL
```

### Step 1.5 — Find your PC's local IP address

You will need your PC's **LAN IP** so the phone can connect.

```powershell
# Windows
ipconfig
# Look for "IPv4 Address" under your Wi-Fi adapter, e.g. 192.168.1.10

# macOS / Linux
ifconfig | grep "inet "
```

> ⚠️ Make sure your PC and phone are on the **same Wi-Fi network**.

### Step 1.6 — Start the server

```bash
python main.py
```

You should see output like:

```
[INFO]  PhoneLink server listening on 0.0.0.0:8765
[INFO]  UDP discovery broadcasting on port 8766
```

Leave this terminal open. The server must be running before the phone can connect.

---

## 📱 Part 2 — Set Up the Mobile App

The mobile app is a React Native (Expo) app that must be compiled as a **custom development build** (not Expo Go) because it uses native Android modules for call detection.

### Step 2.1 — Navigate to the app directory

```bash
cd "Calling app/PhoneLinkExpo"
```

### Step 2.2 — Install JavaScript dependencies

```bash
npm install
```

### Step 2.3 — Configure the server IP

Open `src/hooks/useServerConfig.js` and update the default IP to match your PC's LAN IP from Step 1.5:

```js
// src/hooks/useServerConfig.js
const DEFAULT_IP   = '192.168.1.10';  // ← Your PC's IP here
const DEFAULT_PORT = '8765';
```

> 💡 Alternatively, you can set the IP directly from the app's Settings screen after connecting — no code change required.

### Step 2.4 — Connect your Android phone

1. Enable **USB debugging** on your Android phone:
   - Go to `Settings → About phone` and tap **Build number** 7 times to unlock Developer Options.
   - Go to `Settings → Developer options` and enable **USB Debugging**.
2. Connect your phone to your PC via USB.
3. Verify ADB can see your device:

```bash
adb devices
# Expected output:
# List of devices attached
# XXXXXXXX   device
```

### Step 2.5 — Build and run the app on your device

This command compiles the native Android code and installs it on your phone:

```bash
npm run android
# or
npx expo run:android
```

> ⏳ The first build can take **5–10 minutes** as Gradle downloads dependencies. Subsequent builds are much faster.

Once complete, the **PhoneLink** app will automatically open on your phone.

---

## 🔗 Part 3 — Connect Phone to Server

### Option A — Auto-Discovery (Recommended)

The server broadcasts its IP via **UDP on port 8766**. The mobile app listens for this broadcast and connects automatically.

1. Start the server (Part 1).
2. Open the app on your phone.
3. The app will **automatically detect and connect** to the server within a few seconds.

If auto-discovery succeeds, you will see `🟢 Connected` in the app's status card.

### Option B — Manual IP Entry

If auto-discovery fails (e.g. your router blocks UDP broadcasts):

1. Open the app and navigate to the **Settings** screen.
2. Enter your PC's IP address (from Step 1.5) and port `8765`.
3. Tap **Save & Connect**.

---

## ✅ Part 4 — Grant Required Permissions

On first launch, the app will request the following Android permissions. **All must be granted** for full functionality:

| Permission | Purpose |
|---|---|
| `READ_PHONE_STATE` | Detect incoming and outgoing calls |
| `READ_CALL_LOG` | Read caller information |
| `ANSWER_PHONE_CALLS` | Accept calls remotely from PC |
| `RECORD_AUDIO` | Required for Bluetooth HFP audio routing |
| `BLUETOOTH_CONNECT` | Connect audio to laptop via Bluetooth |

> ⚠️ If you deny any permission, tap **"Request Permissions"** again in the app's home screen banner.

---

## 🎮 Using the App

Once connected (`🟢 Connected`), the app provides the following controls:

### Incoming Call
When your phone rings, a panel appears automatically:
- **✅ Answer** — answers the call on the phone
- **❌ Reject** — rejects the call
- Your PC can also send `accept_call` or `reject_call` commands via the server

### Active Call — Audio Routing
When a call is active, choose where the audio goes:
- **🖥️ Laptop** — routes audio to your PC via Bluetooth HFP
- **📱 Earpiece** — plays audio through the phone earpiece (default)
- **🔊 Speaker** — plays audio through the phone speaker

### Simulate Test
Tap **🧪 Simulate Incoming Call** to send a fake call event to the server — useful for testing the connection without waiting for a real call.

---

## 🌐 WebSocket Message Reference

The phone and server communicate using JSON messages over WebSocket (`ws://PC_IP:8765`).

### Phone → Server (events)

| Event | Payload | Description |
|---|---|---|
| `incoming_call` | `{ event, number? }` | Phone is ringing |
| `call_answered` | `{ event }` | Call was answered on phone |
| `call_rejected` | `{ event }` | Call was rejected on phone |
| `call_ended` | `{ event }` | Active call ended |
| `call_state` | `{ event, state, number? }` | Live call state update |

### Server → Phone (commands)

| Action | Payload | Description |
|---|---|---|
| `accept_call` | `{ action }` | Answer the ringing call |
| `reject_call` | `{ action }` | Reject the ringing call |
| `dial` | `{ action, number }` | Dial a number from the phone |
| `hangup` | `{ action }` | End the active call |
| `set_audio_route` | `{ action, route }` | Route audio (`bluetooth` / `earpiece` / `speaker`) |

---

## 🔍 Troubleshooting

### App won't build — `JAVA_HOME` not set

```powershell
# Set JAVA_HOME (adjust path to your JDK version)
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.x.x-hotspot"
```

### `adb devices` shows no device

- Re-enable USB debugging on the phone.
- Try a different USB cable or port.
- Install the phone manufacturer's USB driver (especially Samsung, Xiaomi).
- Revoke USB debugging authorizations on the phone and re-authorize.

### Phone can't connect to server (auto-discovery fails)

1. Confirm both devices are on the **same Wi-Fi network** (not mobile data).
2. Check Windows Firewall — allow Python on port `8765` (TCP) and `8766` (UDP):
   ```powershell
   netsh advfirewall firewall add rule name="PhoneLink WS" dir=in action=allow protocol=TCP localport=8765
   netsh advfirewall firewall add rule name="PhoneLink UDP" dir=in action=allow protocol=UDP localport=8766
   ```
3. Use **Option B** (manual IP entry) as a fallback.

### Native module not loaded (call detection not working)

This means the app is running inside **Expo Go** instead of the custom build. You must use `npx expo run:android` (not `expo start`) to compile the native modules.

### Gradle build runs out of memory

Add this to `PhoneLinkExpo/android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

---

## 🛠️ Development Tips

- **Reload the app** after code changes: shake the phone → **Reload JS**, or press `R` in the Metro terminal.
- **View logs**: run `adb logcat -s ReactNativeJS` to see JS-side logs in real time.
- **Metro bundler**: keep Metro running in a separate terminal with `npm start` for faster iteration.
- **Server logs**: set `LOG_LEVEL=DEBUG` in `.env` to see every WebSocket message.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native 0.81 + Expo SDK 54 |
| Navigation | React Navigation v7 |
| Native Modules | Custom Android `BroadcastReceiver` (Kotlin) |
| UDP Discovery | `react-native-udp` |
| Server | Python 3 + `websockets` |
| Communication | WebSocket (WS) + UDP broadcast |

---

## 📄 License

This project is for personal use. No license is currently applied.
