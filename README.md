# Mano Attendance: Industrial Workforce Intelligence

**Mano Attendance** is a precision-engineered, high-density workforce monitoring platform designed for enterprise-grade attendance tracking, daily activity reporting, and automated personnel management.

## 🚀 Core Innovations

### 1. High-Density Industrial UI (Obsidian Theme)
- **Precision Scaling**: Implemented a specialized `platform-zoomed` architecture using a **13px base font-size** to achieve an 80% scale equivalent, allowing for high-density data visualization without sacrificing legibility.
- **Mission-Critical UX**: A custom **Obsidian-inspired dark theme** optimized for low-fatigue administrative monitoring.
- **Dynamic 85% Viewport Scaling**: Specialized login and dashboard layouts that maximize screen real estate for complex data grids and calendars.

### 2. RAG-Powered Intelligence (AI Chatbot)
- **Contextual Knowledge Retrieval**: Integrated a Retrieval-Augmented Generation (RAG) system using **ChromaDB** to index corporate policies, attendance rules, and organizational knowledge.
- **LLM-Driven Insights**: Deployment of **Groq SDK** and **Xenova Transformers** for real-time analysis of employee queries and administrative reports.

### 3. DAR 2.0 (Daily Activity Reports)
- **Granular Activity Tracking**: A sophisticated system for logging events, requests, and activities with sub-second precision.
- **LLM-Based Anomaly Detection**: Automated analysis of daily logs to identify workflow bottlenecks and attendance patterns.

### 4. GeoFencing & Precision Security
- **Location-Aware Compliance**: Multi-tier geofencing for secure onsite attendance verification.
- **Organization-Level Isolation**: Robust multi-tenant architecture ensuring data sovereignty for every enterprise.

---

## 🛠 Technical Architecture

### Frontend (Modern React Ecosystem)
- **Build Tool**: Vite (for sub-second HMR)
- **Styling**: Tailwind CSS (with custom utility layers for high-density layouts)
- **Interactions**: Framer Motion (micro-animations)
- **Visualization**: Recharts (for real-time metric tracking)

### Backend (Robust Node.js API)
- **Framework**: Express 5.x (Feature-modular routing)
- **Database**: MySQL (via Knex.js query builder)
- **Real-time**: Socket.io (for instant notification delivery)
- **Security**: Helmet, JWT (HttpOnly), Rate-limiting, and IP tracking.

### Intelligence Layer
- **Vector Database**: ChromaDB
- **Embedding/LLM**: Xenova & Groq
- **Reporting**: ExcelJS & PDFMake for high-fidelity export generation.

---

## 🏗 Current Technical Challenges & Solutions

- **Challenges**:
    - **Data Density**: Displaying thousands of employee records and attendance logs in a unified view.
    - **UI Consistency**: Maintaining a professional, brand-aligned aesthetic across a sprawling set of 50+ modules.
- **Solutions**:
    - **Platform Zooming**: Global font-scaling strategy to unify the viewing experience across different resolutions.
    - **Modular Service Layer**: Abstracting complex DAR and RAG logic into dedicated backend services to maintain API performance.

© 2026 MANO ATTENDANCE. Enterprise Grade Security.
