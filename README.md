# Live Emergency Resource Network (LERN)

LERN is a real-time crisis coordination platform connecting Citizens, Volunteers, NGOs, Hospitals, Rescue Teams, and Government administrators with automated AI assistance.

## Project Structure

```
lern/
├── client/          # React + Vite + Tailwind CSS frontend
├── server/          # Node.js + Express + Socket.IO backend
├── docker-compose.yml
├── .env.example
└── README.md
```

## Features

- **Real-Time Map Operations**: Coordinate deployments on OpenStreetMap layers.
- **AI Agentic Dispatch**: Human-in-the-loop action validation and triage plans.
- **Resource Management**: Live tracking and reservation.
- **Socket.IO Feeds**: Instant notifications, chat channels, and audit log updates.

## Setup Instructions

### 1. Requirements

- Node.js (v18+)
- MongoDB (Local or Atlas)
- Redis (Local or Upstash)
- Docker Desktop (Optional, for local services)

### 2. Install Dependencies

Install all dependencies for workspaces from the root folder:

```bash
npm install
```

### 3. Run Local Databases (Docker)

If using local databases, start MongoDB and Redis with Docker Compose:

```bash
docker compose up -d
```

### 4. Configuration

Copy the env template and set credentials:

```bash
cp .env.example .env
```

### 5. Running the Application

To run both backend and frontend servers in development mode concurrently:

```bash
npm run dev
```

The services will start at:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend: [http://localhost:5000](http://localhost:5000)
- Health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)
