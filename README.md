# CarbonSense Mobile

React Native / Expo mobile app with a Python FastAPI backend.

## Prerequisites

- Node.js 18+
- Python 3.11+
- Expo Go app on your phone (iOS or Android)

## Setup

### 1. Backend

```bash
cd CarbonSenseApp
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Find your local IP address:
- macOS/Linux: `ipconfig getifaddr en0`
- Windows: `ipconfig` → look for IPv4

Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```
Then edit `.env` and replace `<your-local-ip>` with your actual IP.

Start the backend:
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 2. Mobile App

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go. Your phone and computer must be on the same WiFi network.
