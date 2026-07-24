# 🚀 CanSat Ground Control Software (GCS)

A modern web-based Ground Control Software (GCS) developed for monitoring, visualizing, and managing CanSat mission telemetry in real time. The application provides an interactive dashboard for mission control, telemetry visualization, GPS tracking, 3D orientation monitoring, camera feed, and data logging.

---

## 📖 Overview

The CanSat Ground Control Software is designed to serve as the mission control interface for a CanSat. It enables operators to monitor flight parameters, visualize sensor data, control mission states, and maintain mission logs through a user-friendly dashboard.

The software follows a modern client-server architecture using **React** for the frontend and **FastAPI** for the backend, with **MongoDB** as the database.

---

# ✨ Features

## 🔐 Authentication

- Secure user login
- JWT-based authentication
- Protected dashboard routes

---

## 🎛 Mission Control

- Start Mission
- Pause Mission
- Stop Mission
- Reset Mission
- Live mission status updates

---

## 📡 Real-Time Telemetry Dashboard

Displays live mission parameters including:

- Temperature
- Pressure
- Humidity
- Altitude
- Battery Voltage
- Signal Strength (RSSI)
- GPS Coordinates
- Velocity
- Packet Count
- Mission Time

---

## 📍 GPS Tracking

- Interactive Leaflet map
- Live location updates
- Latitude & Longitude display
- Marker visualization

---

## 🛰 3D Orientation

Three.js based orientation viewer displaying:

- Roll
- Pitch
- Yaw

---

## 📷 Live Camera Feed

- Integrated camera panel
- Live video monitoring
- Mission surveillance interface

---

## 📈 Real-Time Data Visualization

Interactive charts for:

- Temperature
- Altitude
- Pressure
- Battery
- Signal Strength

---

## ⚠ Error Monitoring

Displays mission alerts such as:

- Sensor Failure
- Communication Loss
- Battery Warning
- GPS Status
- Mission Alerts

---

## 📝 Data Logging

- Automatic telemetry logging
- Mission history
- CSV export
- Historical data viewing

---

## 🔄 Backend Services

FastAPI backend provides REST APIs for:

- User Authentication
- Telemetry Management
- Mission Control
- Data Logging
- Data Export

---

## 🗄 Database

MongoDB stores:

- User Accounts
- Telemetry Records
- Mission Logs
- Historical Flight Data

---

# 🛠 Technology Stack

## Frontend

- React
- JavaScript
- Tailwind CSS
- Chart.js
- Leaflet
- Three.js
- Axios

## Backend

- FastAPI
- Python
- JWT Authentication
- Motor
- MongoDB

## Database

- MongoDB

---

# 📂 Project Structure

```
ConSat-main/
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   └── ...
│
├── .gitignore
└── README.md
```

---

# ⚙ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/<repository-name>.git

cd ConSat-main
```

---

## 2. Backend Setup

Create virtual environment

```bash
cd backend

python -m venv venv
```

Activate

Windows

```bash
venv\Scripts\activate
```

Linux/Mac

```bash
source venv/bin/activate
```

Install dependencies

```bash
pip install -r requirements.txt
```

Run server

```bash
uvicorn server:app --reload
```

Backend runs at

```
http://localhost:8000
```

---

## 3. Frontend Setup

```bash
cd ../frontend

npm install

npm start
```

Frontend runs at

```
http://localhost:3000
```

---

# 📡 API Endpoints

## Authentication

```
POST /api/auth/login

POST /api/auth/logout

GET /api/auth/me
```

---

## Telemetry

```
GET /api/telemetry

POST /api/telemetry
```

---

## Mission

```
GET /api/mission

POST /api/mission/start

POST /api/mission/pause

POST /api/mission/stop
```

---

## Export

```
GET /api/export/csv
```

---

# 🧪 Testing

The application has been tested for:

- User Authentication
- Dashboard Navigation
- Real-time Telemetry Visualization
- GPS Tracking
- Camera Interface
- Chart Rendering
- CSV Export
- Backend API Communication
- Database Operations

> **Hardware Integration Note:**  
> The software has been designed to interface with a WeGyanik CanSat platform. Due to the unavailability of the physical hardware during development, testing was performed using simulated telemetry data and software modules. The communication architecture is prepared for future integration with actual CanSat hardware.

---


# 👨‍💻 Contributor

**Project Title**

CanSat Ground Control Software

**Developer Name**

Ayush

---
