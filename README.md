# 🏛️ NagarAI — Civic Sense Portal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://www.python.org/)
[![PWA](https://img.shields.io/badge/PWA-ready-purple)](https://web.dev/progressive-web-apps/)
[![Deployed](https://img.shields.io/badge/Status-Live-brightgreen)](https://civic-sense-portal.vercel.app)

**AI-Powered Crowdsourced Civic Issue Reporting System**  
*Problem Statement #25031 — Built in 7 days*

NagarAI empowers citizens to report civic issues (potholes, road damage, garbage overflow) with a single photo. A custom-trained MobileNetV2 DNN auto-classifies the issue in ~50 ms, Groq LLaMA-4 Scout generates a natural-language description, and municipal staff get a real-time dashboard to assign, track, and resolve reports.

## 🌐 Live URLs

| Service | URL |
|---------|-----|
| **Frontend (PWA)** | https://nagarai.vercel.app |
| **Backend API** | https://civic-sense-backend.onrender.com |
| **AI Microservice** | https://civic-sense-ai.onrender.com |

## 🌟 Key Features

- 🤖 **AI Auto-Classification** — MobileNetV2 DNN (86%+ accuracy, ~50 ms inference) classifies pothole / road damage / garbage instantly
- 🧠 **LLM Issue Description** — Groq LLaMA-4 Scout Vision generates human-readable description, severity reason, and repair recommendation
- 📊 **Smart Severity Scoring** — Analytical formula: `base_severity[class] + 0.15 × confidence` gives 0–1 urgency score
- 🔍 **Duplicate Detection** — pHash (perceptual hash) + 50 m geo-proximity check prevents redundant reports
- 🗺️ **Interactive Map Dashboard** — Leaflet.js with clustered markers, severity heatmap toggle, live Socket.io pins
- 📱 **Progressive Web App** — Installable on Android/iOS, offline-capable, Lighthouse PWA ≥ 90
- 🏆 **Civic Gamification** — Civic points + public leaderboard encourages sustained participation
- 📈 **Public Analytics** — Live charts: issue trends, category breakdown, resolution rates
- 👥 **Role-Based Portals** — Citizen / Admin / Department Staff with scoped views and Socket.io live queues

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite 6, Tailwind CSS, Leaflet.js + react-leaflet, Recharts, TanStack Query |
| **Backend** | Node.js 20 + Express, MongoDB Atlas + Mongoose (2dsphere indexes) |
| **AI Service** | Python 3.10 + FastAPI + Uvicorn, TensorFlow/Keras, MobileNetV2, Albumentations |
| **LLM** | Groq LLaMA-4 Scout Vision (natural language descriptions) |
| **Real-time** | Socket.io (issue events + per-department rooms) |
| **Auth** | Firebase Auth (client SDK + Admin SDK server-side verification) |
| **Storage** | Cloudinary (25 GB free — image upload + CDN) |
| **Deployment** | Vercel (Frontend PWA), Render Docker (AI), Render Node (Backend), MongoDB Atlas M0 |

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│              CLIENT (React PWA — Vercel)                 │
│  Citizen pages · Admin portal · Dept queue · Analytics   │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTPS + WebSocket
                      ▼
┌──────────────────────────────────────────────────────────┐
│           BACKEND (Node.js + Express — Render)           │
│  REST API · Socket.io · Firebase Auth verify · Mongoose  │
│  └─ MongoDB Atlas    └─ Cloudinary    └─ AI Service →    │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTP
                      ▼
┌──────────────────────────────────────────────────────────┐
│         AI MICROSERVICE (FastAPI — Render Docker)        │
│  MobileNetV2 DNN (~50ms) · Groq LLaMA-4 Scout Vision    │
│  pHash duplicate detection · Severity formula            │
└──────────────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
civic-sense-portal/
├── client/               # React 18 + Vite PWA
│   ├── public/icons/     # PWA icons (192 + 512 SVG)
│   └── src/
│       ├── components/   # Navbar, StatusBadge, IssueCard, LocationPicker, Toast, ErrorBoundary
│       ├── pages/        # Home, IssueSubmit, IssueList, IssueDetail, MapDashboard,
│       │                 #   MyReports, Analytics, Leaderboard, admin/, department/
│       ├── services/     # api.js (Axios), auth.js (Firebase), socket.js
│       └── context/      # AuthContext, ToastContext
│
├── server/               # Node.js + Express
│   ├── controllers/      # authController, issueController
│   ├── middleware/        # auth.js (Firebase token verify)
│   ├── models/           # User, Issue, Department, IssueUpdate
│   ├── routes/           # auth, issues, admin, analytics
│   ├── services/         # aiService.js (FastAPI client)
│   └── utils/            # seed.js, smokeTest.js
│
├── ai-service/           # Python 3.10 + FastAPI
│   ├── app/              # main.py, predictor.py, groq_client.py
│   ├── models/           # mobilenetv2_best.keras (trained weights)
│   ├── notebooks/        # train_phase1.ipynb, train_phase2.ipynb
│   └── scripts/          # prepare_dataset.py, augment_pipeline.py
│
├── docs/                 # API.md, SETUP.md, DEPLOY.md
├── render.yaml           # Render Blueprint (backend + AI service)
└── DEV_REPORT.md         # Full technical report
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- Python 3.10 or higher
- npm or yarn
- A free [MongoDB Atlas](https://cloud.mongodb.com/) account
- A free [Firebase](https://console.firebase.google.com/) project (Auth enabled)
- A free [Cloudinary](https://cloudinary.com/) account
- A free [Groq](https://console.groq.com/) API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kaizoku-Ayush/Civic-Sense-Portal.git
   cd Civic-Sense-Portal
   ```

2. **Setup Frontend**
   ```bash
   cd client
   npm install
   npm run dev
   ```

3. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

4. **Setup AI Service**
   ```bash
   cd ai-service
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   source .venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

5. **Setup Database**
   - Create a free M0 cluster at https://cloud.mongodb.com/
   - Whitelist your IP and create a DB user
   - Copy the connection string to `server/.env` as `MONGODB_URI`
   - Collections and indexes are created automatically on first run

## 📖 Development Sprint (7 Days — Mar 6–12, 2026)

| Day | Focus | Status |
|-----|-------|--------|
| Day 1 | FastAPI AI Microservice | ✅ Done |
| Day 2 | Backend Issues API | ✅ Done |
| Day 3 | Frontend Core | ✅ Done |
| Day 4 | Admin Portal + Real-time | ✅ Done |
| Day 5 | PWA + Polish | ✅ Done |
| Day 6 | Deploy Everything | ✅ Done |
| Day 6.5 | Visual Intelligence & Rebrand → NagarAI | ✅ Done |
| Day 6.6 | Landing Page & Leaderboard | ✅ Done |
| Day 7 | Demo Prep & Final Push | ✅ Done |

See [ROADMAP.md](ROADMAP.md) for detailed day-by-day tasks and [DEV_REPORT.md](DEV_REPORT.md) for the full technical report.

## 🎯 Problem Statement

**ID**: 25031  
**Title**: Crowdsourced Civic Issue Reporting and Resolution System

Local governments face challenges in identifying and resolving civic issues. This platform empowers citizens to report issues with photos and location data while providing municipalities with powerful tools to track, prioritize, and resolve them efficiently.

## 📊 AI/ML Pipeline

```
Image Upload
  └─ MobileNetV2 DNN (~50 ms)
       ├─ category (pothole / road_damage / garbage)  86%+ accuracy
       ├─ confidence score (softmax probability)
       ├─ severity = BASE[class] + 0.15 × confidence
       └─ pHash (64-bit perceptual hash for duplicate check)
  └─ Groq LLaMA-4 Scout Vision (async)
       ├─ human-readable description
       ├─ severity reason
       └─ actionable recommendation
```

| Component | Detail |
|-----------|--------|
| **Base model** | MobileNetV2 (ImageNet pre-trained, depthwise separable convolutions) |
| **Training** | Phase 1 frozen backbone → 86.04% val_acc; Phase 2 top-30 fine-tuned |
| **Dataset** | 6,786 images (pothole + road_damage + garbage), 70/15/15 split, seed=42 |
| **Inference** | ~50 ms CPU, float32 Keras model served via FastAPI |
| **LLM** | Groq LLaMA-4 Scout Vision — structured prompt → description + recommendation |
| **Duplicate** | pHash Hamming < 10 AND geo < 50 m → flagged as DUPLICATE |

## 📚 Datasets Used

| Dataset | Source | Images | Mapped Class |
|---------|--------|--------|--------------|
| Pothole Segmentation YOLOv8 | Roboflow | 780 | pothole |
| Road Damage India (RDD) | CRDDC / PASCAL VOC | 1,786 filtered | pothole + road_damage |
| Garbage Classification | Kaggle | 2,527 | garbage |
| TACO | COCO (15 batches) | 1,500 | garbage |
| **Total used** | | **6,786** | 3 classes |

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Ayush** - [@Kaizoku-Ayush](https://github.com/Kaizoku-Ayush)

## 🙏 Acknowledgments

- Problem Statement by [Organization Name]
- Dataset providers: RDD2022, TACO, Kaggle
- Inspiration from civic tech initiatives worldwide

## 📞 Contact

For questions or feedback, please open an issue or contact [your-email@example.com]

---

**Built with ❤️ for better civic engagement**
