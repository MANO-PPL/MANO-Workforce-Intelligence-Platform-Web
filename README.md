# Mano Workforce Intelligence Platform

Mano is a high-density workforce monitoring, attendance tracking, and administrative intelligence platform designed for enterprise-grade team management, daily activity reporting, and organizational collaboration.

## Core Modules and Features

### 1. High-Density Industrial UI (Obsidian Theme)
- Specialized global scaling architecture leveraging an 80% equivalent zoom-level layout. Uses a base font-size of 13px to maximize screen real estate and data visibility without compromising legibility.
- Professional dark mode design optimized for low fatigue during extended administrative monitoring.
- High-density grids, data tables, and calendars that scale dynamically depending on viewport dimensions.

### 2. User Authentication and Tenant Isolation
- Secure session management utilizing JSON Web Tokens (JWT) with HttpOnly cookie support and role-based access control.
- Clear separation of access levels for super administrators, organization administrators, HR personnel, and general employees.
- Complete multi-tenant data sovereignty, ensuring that all policies, logs, and employee details are isolated at the organization level.

### 3. Executive Dashboard
- Interactive summaries displaying active workforce metrics, current shift coverage, daily activity, and checked-in personnel rates.
- Graphical trend charts tracking weekly check-in counts, shift timings compliance, and department distributions.
- Real-time feed highlighting check-in locations, check-out events, and pending administrative requests.

### 4. Attendance Tracking and Live Monitoring
- Real-time administrative monitor displaying check-in times, check-out times, and calculated late check-in or early leave durations.
- Automated compliance alerts flags for out-of-boundary check-ins and unauthorized device identifiers.
- Self-service employee portals for location-validated check-in and check-out.
- Correction request system enabling employees to propose adjustments for missing logs, with full administrative approval workflows.

### 5. Shift Management and Geofencing
- Dynamic creation and assignment of work shifts with configurable start times, end times, grace periods, and late-arrival limits.
- Precise geofencing controls allowing administrators to designate valid check-in coordinates and set search radius thresholds in meters.
- Multi-location bindings to assign employees to specific branch offices or external job sites.

### 6. Daily Activity Reports (DAR)
- Individual work logs where employees record tasks, meetings, project tags, and hours spent on each activity.
- Daily reporting feeds detailing employee daily entries.
- RAG-powered automated analysis scanning activity logs to identify productivity bottlenecks, check-in anomalies, and provide feedback.

### 7. Holidays and Leave Management
- Multi-category leave request system supporting medical leaves, casual leaves, and earned leaves.
- Visual leave tracker displaying team-wide calendar details of upcoming organization holidays and approved absences.
- Automated balance calculations tracking remaining leave allowances for each employee profile.

### 8. Chat and Collaboration Hub
- Real-time direct messaging between team members and group channel chats powered by Socket.io.
- Encrypted history storage that ensures data security while maintaining rapid message retrieval.
- Removed Member History Retention: Users removed from a group can no longer send new messages or view newly sent content, but they retain read access to historical group messages up to the exact timestamp of their removal.
- Participant Color-Coding: Unique deterministic color assignments for usernames, initial placeholders, and bubble borders/backgrounds to clearly differentiate participants in group conversations.
- File and Attachment Sharing: Support for document and image uploads up to 50MB, utilizing S3/compatible secure file storage.

### 9. Super-Admin Panel
- Global overview console tracking organization tenants, active user counts, and system metrics.
- Server health dashboard exposing real-time logs, network request latency, database query counts, and connection pools.
- Security alert feed monitoring rate-limit violations, token expirations, and administrative modifications.

---

## Technical Stack

### Frontend (React Ecosystem)
- Build Tool: Vite
- Structure: React 18, React Router DOM
- Styling: Tailwind CSS (with custom utility layers for high-density components)
- Animation: Framer Motion (micro-interactions and modal transitions)
- Charts: Recharts
- Icons: Lucide React

### Backend (Node.js API)
- Framework: Express 5.x
- Database Queries: Knex.js
- Caching Layer: Redis
- Real-Time Communication: Socket.io
- Security Protocols: Helmet, Express Rate Limit, JWT-based Sessions

### Intelligence Layer
- Vector Search: ChromaDB
- LLM Engines: Groq Cloud SDK, Xenova Transformers
- Export Generators: ExcelJS, PDFMake

---

## Database Architecture
The platform is designed around a relational database architecture managed via Knex.js.
- Table chat_rooms contains fields for room_id, org_id, room_name, room_type (direct or group), created_by, member_ids (JSON array of user IDs), messages (encrypted JSON array of message objects), last_read_times (JSON mapping user_id to read timestamps), and removed_members (JSON mapping user_id to their removal details and timestamps).

---

## Getting Started

### Prerequisites
- Node.js version 20.19+ or 22.12+
- Redis Server (local or cloud instance)
- MySQL / PostgreSQL / SQLite database

### Installation
1. Clone the repository and navigate to the project root.
2. Install root dependencies:
   ```bash
   npm install
   ```
3. Navigate to the backend directory, duplicate the environment template, and configure your keys:
   ```bash
   cd backend
   cp .env.example .env
   npm install
   ```
4. Navigate to the frontend directory and install dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Running Locally
To launch both the backend server and the Vite frontend dev server concurrently, run the following command from the project root:
```bash
npm start
```
- Backend server runs on http://localhost:5002
- Frontend dev server runs on https://localhost:5173
