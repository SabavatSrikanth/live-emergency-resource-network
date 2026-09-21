# Live Emergency Resource Network (LERN) 🚨⚡

**LERN** is a state-of-the-art, real-time crisis coordination platform designed to bridge communication between **Citizens, Volunteers, NGOs, Hospitals, Rescue Teams, and Command Dispatchers** with automated AI triage assistance.

![LERN Platform](https://img.shields.io/badge/Status-Live%20%26%20Operational-emerald?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20Express%20%7C%20Socket.IO%20%7C%20Leaflet-blue?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSabavatSrikanth%2Flive-emergency-resource-network&root-directory=client)

---

## 🌟 Key Features

### 🗺️ 1. Interactive OpenStreetMap Geospatial Radar
- **Live Leaflet Layering**: Render color-coded pulsing markers for active emergencies, hospital bed capacities, and supply depots.
- **Geospatial Radius Query**: Filter incidents and resources dynamically within 5km, 10km, 25km, or 50km radii.
- **Interactive "Report on Map" Mode**: Click anywhere on the map grid to set a pin at exact latitude/longitude coordinates and file an incident report on the spot.

### 🤖 2. LERN Command Agent & AI Dispatcher (Agentic AI)
- **Agentic Workflows**: Powered by **LangChain** and **Google Generative AI**, the LERN Command Agent dynamically calls tools to read real-time database state and formulate decisions.
- **Automated Triage Generation**: When an incident is created, the Agent uses tools to scan available resources (Ambulances, Fire Tenders, Rescue Squads, ICU beds) and strictly recommends deployments based on live capacity.
- **Human-in-the-Loop Protocol**: Command Dispatchers review the AI-proposed action plans and must explicitly approve them before deploying instantly across field units.
- **Agentic AI Chat Assistant**: The dispatcher chatbot is equipped with conversational memory and tools. Query the Agent in natural language to dynamically get live hospital bed counts, active incident tallies, and responder statuses directly from the database.

### ⚡ 3. Socket.IO Real-Time Synchronization
- **Zero-Latency Feeds**: Live WebSocket broadcasting for newly filed reports, status updates (`VERIFYING` ➔ `DISPATCHED` ➔ `RESOLVED`), and emergency broadcasts.
- **Multi-Channel Chat**: Encrypted communication streams for `ai-dispatch`, `incident-coordination`, and `volunteer-broadcast`.

### 👥 4. Multi-Role Authentication & Quick Access
- **Role-Based Workflows**: Tailored user experiences for **Citizen**, **Volunteer**, **NGO Coordinator**, **Hospital Admin**, and **Dispatcher**.
- **Quick Demo Access**: One-click demo login presets on the sign-in screen for instant testing without manual typing.

### 💾 5. Zero-Dependency Fallback Engine
- **Hybrid Storage**: Operates on MongoDB & Redis when connected, while featuring a seamless **in-memory seed fallback engine**. The platform runs 100% out of the box even without active database services.

---

## 📁 Repository Structure

```
lern/
├── client/                   # React + Vite + Tailwind CSS + Leaflet Frontend
│   ├── src/
│   │   ├── components/       # Auth guards, dark mode toggles
│   │   ├── layouts/          # Root layout & sidebar navigation
│   │   ├── pages/            # Dashboard, MapView, Reports, Chat, Login
│   │   ├── services/         # Axios API & Socket.IO singleton
│   │   └── store/            # Zustand state stores (Incidents, Resources, Auth)
│   └── package.json
│
├── server/                   # Node.js + Express + Socket.IO Backend
│   ├── src/
│   │   ├── config/           # Database & environment connection
│   │   ├── controllers/      # Incident, Resource, Chat & Auth controllers
│   │   ├── middleware/       # JWT auth & validator middleware
│   │   ├── models/           # Mongoose schemas (Incident, Resource, Message, User)
│   │   ├── routes/           # REST API routes
│   │   ├── utils/            # Winston logger & Seed data store
│   │   └── server.js         # HTTP & Socket.IO server entry point
│   └── package.json
│
├── docker-compose.yml        # Local MongoDB & Redis service config
├── .env.example              # Environment variables template
└── README.md
```

---

## 🛠️ REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/incidents` | List all incidents (with priority/category filter) |
| `POST` | `/api/incidents` | Create a new emergency incident & trigger AI triage |
| `PATCH` | `/api/incidents/:id` | Update incident status / priority |
| `POST` | `/api/incidents/:id/ai-dispatch` | Deploy AI response plan & broadcast to units |
| `GET` | `/api/resources` | List emergency resources (hospital beds, ambulances) |
| `PATCH` | `/api/resources/:id` | Update resource availability or allocation |
| `GET` | `/api/chat/messages` | Fetch channel message history |
| `POST` | `/api/chat/messages` | Send message & get automated AI dispatcher reply |
| `GET` | `/api/health` | Backend service health check |

---

## 🚀 Quick Setup Instructions

### 1. Requirements
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 2. Install Dependencies
Install dependencies for all workspaces from the project root:
```bash
npm install
```

### 3. Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```

### 4. Run Development Server
Start both backend and frontend concurrently with a single command:
```bash
npm run dev
```

Access the application at:
- **Frontend App**: [http://localhost:5173](http://localhost:5173) (or `http://localhost:5174`)
- **Backend Service**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 License & Attribution

Built with ❤️ for disaster response teams and emergency responders worldwide.
