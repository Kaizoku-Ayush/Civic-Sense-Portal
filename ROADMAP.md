# CIVIC SENSE PORTAL - PROJECT ROADMAP
## AI-Powered Crowdsourced Civic Issue Reporting System

| Property | Value |
|----------|-------|
| Project Type | Web Application (Progressive Web App - PWA) |
| Problem Statement | #25031 — Crowdsourced Civic Issue Reporting and Resolution System |
| Original Timeline | 4 Weeks (Feb 2 – Mar 1, 2026) |
| **Revised Sprint** | **7 Days (Mar 6 – Mar 12, 2026)** |
| **Submission Deadline** | **March 13, 2026** |
| **Status** | 🔥 DAY 6/7 COMPLETE — all services live, 13/13 smoke test passing |

---

## TECH STACK

### FRONTEND
- React.js 18 + Vite
- Tailwind CSS
- Leaflet.js + react-leaflet (interactive maps)
- PWA (vite-plugin-pwa — manifest + service worker)
- Axios + TanStack React Query
- Socket.io-client (real-time updates)
- Firebase Auth (client SDK)

### BACKEND
- Node.js + Express.js
- MongoDB + Mongoose (2dsphere indexes for geospatial)
- Socket.io (real-time events)
- Multer + Cloudinary (image uploads)
- Firebase Admin SDK (token verification)

### AI/ML MICROSERVICE
- Python 3.10 + FastAPI + Uvicorn
- TensorFlow/Keras — MobileNetV2 classifier (86%+ accuracy)
- **Groq LLaMA-4 Scout Vision** — natural language issue description (free tier)
- OpenCV + ImageHash (preprocessing + duplicate detection)
- TFLite (float32 + float16) for edge deployment

### CLOUD / FREE TIER
- Firebase Auth (authentication)
- Cloudinary (image storage — 25 GB free)
- MongoDB Atlas (M0 free cluster)
- Render or Railway (backend + AI service hosting)
- Vercel (frontend)

---

## ✅ WHAT'S ALREADY DONE (Feb 2 – Mar 6)

| Item | Status | Details |
|------|--------|---------|
| Project scaffold | ✅ | `client/`, `server/`, `ai-service/`, `docs/` |
| React app (Vite 6, React 18) | ✅ | Auth pages, routing, Tailwind |
| Firebase Auth (client + server) | ✅ | Login, Register, Google, middleware |
| MongoDB schemas | ✅ | User, Issue, Department, IssueUpdate |
| Dataset preparation | ✅ | 6 786 images, 3 classes, 70/15/15 split |
| AI training Phase 1 | ✅ | MobileNetV2 frozen backbone — 86.04% val_acc |
| AI training Phase 2 | ✅ | Fine-tuned top-30 layers, TFLite exports |
| FastAPI AI service | ✅ | `/predict` — DNN + Groq vision combo, `/health`, `/classes` |
| Dockerfile (AI service) | ✅ | `ai-service/Dockerfile` |
| Backend Issues API | ✅ | POST/GET/PATCH issues, Cloudinary upload, AI integration, duplicate detection, Socket.io |
| Frontend Core | ✅ | IssueSubmit, IssueList, IssueDetail, MapDashboard, MyReports, Navbar, StatusBadge, LocationPicker |
| Admin Portal + Real-time | ✅ | AdminDashboard, DeptDashboard, /api/admin/stats, bulk update, dept Socket.io rooms |
| PWA + Polish | ✅ | vite-plugin-pwa, manifest, service worker, offline page, toasts, error boundary, skeletons |

---

## 🚀 7-DAY FINAL SPRINT (Mar 6–12, 2026)

### Priority framework
- **Must-have** — judges will look for this, fail without it
- **Should-have** — strong differentiator, do if time allows
- **Nice-to-have** — polish only after core works

---

### DAY 1 (Mar 6) — FastAPI AI Microservice ✅ DONE

| Task | Priority | Status |
|------|----------|--------|
| FastAPI app skeleton (`app/main.py`) | Must | ✅ |
| `POST /predict` — DNN + severity formula | Must | ✅ |
| Groq LLaMA-4 Scout vision analysis | Must | ✅ |
| pHash duplicate detection | Must | ✅ |
| `GET /health`, `GET /classes` | Must | ✅ |
| Dockerfile | Must | ✅ |
| `groq` SDK installed in venv | Must | ✅ |

**AI pipeline per request:**
```
Image → MobileNetV2 DNN → category + confidence + severity + pHash (~50 ms)
                        ↓
             Groq LLaMA-4 Scout → description + severity_reason + recommendation
                        ↓
             JSON response with both AI outputs
```

---

### DAY 2 (Mar 7) — Backend Issues API ✅ DONE

**Goal:** Full CRUD for issues, Cloudinary upload, AI service integration, duplicate detection.

| Task | Priority | Status |
|------|----------|--------|
| `POST /api/issues` — upload to Cloudinary → call AI service → save to MongoDB | Must | ✅ |
| `GET /api/issues` — list with filters (category, status, lat/lng radius) | Must | ✅ |
| `GET /api/issues/:id` — full issue detail | Must | ✅ |
| `PATCH /api/issues/:id/status` — status transitions | Must | ✅ |
| `POST /api/issues/:id/upvote` — citizen upvote | Should | ✅ |
| Duplicate detection: hamming distance pHash < 10 + geo proximity < 50 m | Must | ✅ |
| Auto-assign department by AI category (garbage→Sanitation, pothole/road→PublicWorks) | Must | ✅ |
| `server/services/aiService.js` — axios client wrapping FastAPI | Must | ✅ |
| `server/controllers/issueController.js` | Must | ✅ |
| `server/routes/issues.js` | Must | ✅ |
| Socket.io emit `issue:new` on creation | Should | ✅ |

**Issue status flow:**
```
PENDING → ACKNOWLEDGED → IN_PROGRESS → RESOLVED
                                     ↘ REJECTED
```

---

### DAY 3 (Mar 8) — Frontend Core ✅ DONE

**Goal:** Issue submission form + Map + Issue list + Issue detail.

| Task | Priority | Status |
|------|----------|--------|
| `IssueSubmit` — image upload + camera capture | Must | ✅ |
| AI preview card — DNN category/confidence + Groq description while user fills form | Must | ✅ |
| Browser geolocation auto-fill + draggable Leaflet pin | Must | ✅ |
| `POST /api/issues` submit with loading state | Must | ✅ |
| `MapDashboard` — Leaflet map, clustered markers, category colour icons | Must | ✅ |
| Marker popup with image thumbnail + status/severity badge | Must | ✅ |
| `IssueList` — card grid, filter bar (category / status / sort) | Must | ✅ |
| `IssueDetail` — image, AI analysis panel, status progress stepper, timeline | Must | ✅ |
| `MyReports` — user's own submissions + stats strip | Should | ✅ |
| Socket.io: new issue → map pin appears live | Should | ✅ |
| `Navbar` — sticky responsive nav, avatar dropdown, mobile hamburger | Must | ✅ |
| `StatusBadge`, `CategoryBadge`, `SeverityBar` reusable components | Must | ✅ |

**`client/src/pages/` delivered:**
```
IssueSubmit.jsx    ✅
IssueList.jsx      ✅
IssueDetail.jsx    ✅
MapDashboard.jsx   ✅
MyReports.jsx      ✅
```

**Bug fix:** `ProtectedRoute.jsx` pre-existing broken import (`'../hooks/useAuth'` → `'../../hooks/useAuth'`) — caused production build failure, now fixed.

---

### DAY 4 (Mar 9) — Admin Portal + Real-time ✅ DONE

**Goal:** Admin dashboard, role-based routing, department assignment, Socket.io.

| Task | Priority | Status |
|------|----------|--------|
| `pages/admin/AdminDashboard.jsx` — issue table with filters | Must | ✅ |
| Status update + department re-assignment from admin table | Must | ✅ |
| Role guard — redirect non-admins | Must | ✅ |
| `pages/department/DeptDashboard.jsx` — staff see only their queue | Must | ✅ |
| Socket.io room per department — live queue updates | Should | ✅ |
| `GET /api/admin/stats` — counts by status/category | Must | ✅ |
| Basic analytics cards (total, pending, resolved, avg severity) | Must | ✅ |
| `PATCH /api/admin/issues/:id` — bulk status + assign | Must | ✅ |

**Delivered:**
- `GET /api/admin/stats` — total, pending, acknowledged, inProgress, resolved, rejected, byCategory, avgSeverity
- `PATCH /api/admin/issues/:id` — full update with `IssueUpdate` timeline entry + socket emit
- `POST /api/admin/issues/bulk` — bulk status/department change + `issues:bulk-updated` socket emit
- `GET /api/issues/department` — dept staff queue endpoint (scoped to `req.user.departmentId`)
- Socket.io `join-department` / `leave-department` room handlers in `app.js`
- `AdminDashboard` — 6 stat cards, category breakdown, filter bar, bulk toolbar, inline row editor
- `DeptDashboard` — status strip, filter tabs, card grid with AI snippet + one-tap status transitions
- `Navbar` — "My Queue" link for `DEPARTMENT_STAFF` role

---

### DAY 5 (Mar 10) — PWA + Polish ✅ DONE

**Goal:** PWA installable, mobile-first pass, offline page.

| Task | Priority | Status |
|------|----------|--------|
| Install `vite-plugin-pwa`, configure `manifest.json` | Must | ✅ |
| App icons (192×192, 512×512 SVG) | Must | ✅ |
| Service worker — cache shell, offline fallback page | Must | ✅ |
| Lighthouse PWA audit ≥ 90 | Must | ✅ |
| Mobile responsive pass — all pages | Must | ✅ |
| Loading skeletons on issue list + map | Should | ✅ |
| Toast notifications (issue submitted, status changed) | Should | ✅ |
| Error boundaries on major pages | Should | ✅ |
| `env.example` files complete, SETUP.md updated | Must | ✅ |

**Delivered:**
- `vite-plugin-pwa` installed + `VitePWA()` configured in `vite.config.js` — manifest auto-generated, Workbox service worker precaches 11 entries (758 KiB)
- Icons: `client/public/icons/icon-192.svg` + `icon-512.svg` (indigo map-pin + checkmark, maskable)  
- Offline page: `client/public/offline.html` — animated no-connection indicator + retry button
- Runtime caching: OpenStreetMap tiles (CacheFirst, 30d), CDN assets (CacheFirst, 7d)
- `ToastContext.jsx` + `Toast.jsx` — `addToast(message, type, duration)` hook wired in IssueSubmit, IssueDetail, AdminDashboard, DeptDashboard
- `ErrorBoundary.jsx` — class component wrapping entire app in App.jsx
- MapDashboard loading skeleton overlay — spinner + animated tile grid
- `ai-service/.env.example` created; `client/.env.example` + `server/.env.example` updated with production comments
- `docs/SETUP.md` — added PWA Testing section
- `npm run build` passes cleanly — `dist/sw.js` + `dist/manifest.webmanifest` generated ✓

---

### DAY 6 (Mar 11) — Deploy Everything ✅ DONE

**Goal:** Three live URLs — frontend, backend, AI service.

| Task | Priority | Service | Status |
|------|----------|---------|--------|
| MongoDB Atlas — create production cluster | Must | Atlas | ✅ |
| Deploy AI service (FastAPI) | Must | Render (Docker) | ✅ |
| Set `GROQ_API_KEY` env on AI service host | Must | Render env vars | ✅ |
| Deploy Node.js backend | Must | Render (Node) | ✅ |
| Deploy React frontend | Must | Vercel | ✅ |
| Configure CORS on backend for Vercel domain | Must | — | ✅ |
| Configure `VITE_API_URL` + Firebase env vars on Vercel | Must | — | ✅ |
| End-to-end smoke test on production | Must | — | ✅ |
| Seed 5–10 realistic issues | Must | — | ✅ |

**Delivered:**
- `render.yaml` — Render Blueprint defining both `civic-sense-backend` (Node) + `civic-sense-ai` (Docker) services
- `client/vercel.json` — SPA rewrites, immutable asset cache headers, SW/manifest content-type headers
- `server/utils/seed.js` — seeds 3 departments + 1 admin + 10 realistic issues (Indian cities, mixed statuses/severity)
- `server/scripts/smokeTest.js` — 13-check end-to-end production health test (`npm run smoke`)
- `docs/DEPLOY.md` — full 8-step deployment guide: Atlas → Render AI → Render Backend → Vercel → CORS → seed → smoke
- CORS updated to support comma-separated `FRONTEND_URL` in `server/app.js`

---

### DAY 7 (Mar 12) — Demo Prep

**Goal:** Polished, submittable project.

| Task | Priority | Status |
|------|----------|--------|
| Record 3–5 min demo video: citizen submits issue → AI classifies + Groq describes → admin resolves | Must | ⬜ |
| Presentation slides (problem → solution → AI pipeline → live demo → impact) | Must | ⬜ |
| Update README with architecture diagram, setup instructions, live URLs | Must | ⬜ |
| Final PROGRESS.md update with all metrics | Must | ⬜ |
| Make sure train_phase2.ipynb has all cells run with output | Must | ⬜ |
| Backup: push everything to GitHub | Must | ⬜ |

---

## DEMO SCRIPT (for Day 7)

1. Open app on mobile (PWA) — show "Add to Home Screen"
2. Citizen submits a pothole photo → AI instantly shows: *"Pothole detected (94% confidence), Severity 0.99 — Large pothole posing immediate vehicle damage risk. Dispatch road crew within 24h."*
3. Map dashboard — marker appears live (Socket.io)
4. Admin portal — assigns to Public Works dept, changes status to IN_PROGRESS
5. Show analytics cards: total issues, avg severity, resolution rate
6. Show Lighthouse PWA score ≥ 90

---

## DROPPED FROM SCOPE (time constraint)

| Feature | Reason |
|---------|--------|
| Separate severity regression model (train_phase2.ipynb section 11) | Analytic formula gives identical UX; saves hours of training time |
| Email notifications (Nodemailer) | Complex, not visible in demo |
| Heatmap layer | Nice-to-have, no time |
| Public transparency dashboard | Admin dashboard covers this for judges |
| Load testing (Artillery/k6) | Not needed for demo |
| Offline issue queue (IndexedDB sync) | Service worker cache covers offline UX |

---

## DATABASE SCHEMA (MongoDB / Mongoose)

```javascript
// User Schema
const userSchema = new mongoose.Schema({
  firebaseUid:  { type: String, required: true, unique: true },
  email:        { type: String, required: true, unique: true },
  name:         { type: String, required: true },
  phone:        { type: String, default: null },
  role:         { type: String, enum: ['CITIZEN','ADMIN','DEPARTMENT_STAFF'], default: 'CITIZEN' },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  civicPoints:  { type: Number, default: 0 },
  avatarUrl:    { type: String, default: null },
}, { timestamps: true });

// Department Schema
const departmentSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  email:       String,
  phone:       String,
  zonePolygon: { type: { type: String, enum: ['Polygon'] }, coordinates: [[[Number]]] }, // GeoJSON
}, { timestamps: true });

// Issue Schema
const issueSchema = new mongoose.Schema({
  userId:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:               String,
  description:         String,
  category:            { type: String, required: true },  // 'pothole' | 'road_damage' | 'garbage'
  aiCategory:          String,
  aiConfidence:        Number,
  aiSeverityScore:     Number,
  imageUrl:            { type: String, required: true },
  imageHash:           String,
  location: {
    type:        { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }        // [longitude, latitude]
  },
  address:             String,
  status:              { type: String, enum: ['PENDING','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','REJECTED','DUPLICATE'], default: 'PENDING' },
  priority:            { type: String, enum: ['LOW','MEDIUM','HIGH','CRITICAL'], default: 'MEDIUM' },
  assignedDepartment:  { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  assignedUser:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  duplicateOf:         { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null },
  resolvedAt:          Date,
  resolutionImageUrl:  String,
  resolutionNotes:     String,
}, { timestamps: true });

// 2dsphere index for geospatial queries (replaces PostGIS)
issueSchema.index({ location: '2dsphere' });
departmentSchema.index({ zonePolygon: '2dsphere' });

// Issue Updates / Timeline Schema
const issueUpdateSchema = new mongoose.Schema({
  issueId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  oldStatus: String,
  newStatus: String,
  comment:   String,
  isPublic:  { type: Boolean, default: true },
}, { timestamps: true });

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
  type:    { type: String, required: true },
  title:   { type: String, required: true },
  message: String,
  isRead:  { type: Boolean, default: false },
}, { timestamps: true });
```

---

## API ENDPOINTS

### AUTHENTICATION
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login (Firebase token verification)
GET    /api/auth/me                - Get current user profile
PUT    /api/auth/me                - Update profile
```

### ISSUES (Public/Citizen)
```
GET    /api/issues                 - List all issues (with filters)
GET    /api/issues/:id             - Get single issue
POST   /api/issues                 - Create new issue
GET    /api/issues/my              - Get current user's issues
GET    /api/issues/nearby          - Get issues near location
```

### ISSUES (Admin)
```
PUT    /api/admin/issues/:id       - Update issue (status, assignment)
POST   /api/admin/issues/bulk      - Bulk update issues
GET    /api/admin/issues/pending   - Get pending issues for assignment
POST   /api/admin/issues/:id/merge - Merge duplicate issues
```

### DEPARTMENTS
```
GET    /api/departments            - List all departments
GET    /api/departments/:id/issues - Get department's assigned issues
PUT    /api/departments/:id/issues/:issueId - Update issue (department staff)
```

### AI SERVICE
```
POST   /api/ai/classify            - Classify image
POST   /api/ai/severity            - Get severity score
POST   /api/ai/check-duplicate     - Check for duplicates
```

### ANALYTICS
```
GET    /api/analytics/overview     - Dashboard overview stats
GET    /api/analytics/trends       - Issue trends over time
GET    /api/analytics/heatmap      - Heatmap data
GET    /api/analytics/departments  - Department performance
```

### NOTIFICATIONS
```
GET    /api/notifications          - Get user notifications
PUT    /api/notifications/:id/read - Mark as read
PUT    /api/notifications/read-all - Mark all as read
```

---

## FOLDER STRUCTURE

```
civic-sense-portal/
├── client/                          # React Frontend
│   ├── public/
│   │   ├── manifest.json
│   │   └── icons/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/              # Button, Input, Card, etc.
│   │   │   ├── map/                 # MapView, Marker, Heatmap
│   │   │   ├── issues/              # IssueCard, IssueForm, IssueList
│   │   │   └── admin/               # AdminTable, Analytics
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ReportIssue.jsx
│   │   │   ├── IssueDetail.jsx
│   │   │   ├── MyReports.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── IssueManagement.jsx
│   │   │   │   ├── Analytics.jsx
│   │   │   │   └── UserManagement.jsx
│   │   │   └── department/
│   │   │       └── DeptDashboard.jsx
│   │   ├── services/
│   │   │   ├── api.js               # Axios instance
│   │   │   ├── auth.js              # Firebase auth
│   │   │   └── socket.js            # Socket.io client
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── context/                 # Auth context, etc.
│   │   ├── utils/                   # Helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js Backend
│   ├── config/
│   │   ├── db.js                    # MongoDB connection (Mongoose)
│   │   └── firebase.js              # Firebase Admin SDK
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── issueController.js
│   │   ├── adminController.js
│   │   └── analyticsController.js
│   ├── middleware/
│   │   ├── auth.js                  # JWT/Firebase verification
│   │   └── roleCheck.js             # Role-based access
│   ├── models/
│   │   ├── User.js
│   │   ├── Issue.js
│   │   └── Department.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── issues.js
│   │   ├── admin.js
│   │   └── analytics.js
│   ├── services/
│   │   ├── aiService.js             # FastAPI client
│   │   ├── notificationService.js
│   │   └── routingService.js
│   ├── utils/
│   ├── app.js
│   └── package.json
│
├── ai-service/                      # Python FastAPI
│   ├── models/
│   │   └── civic_classifier.h5     # Trained model
│   ├── app/
│   │   ├── main.py                  # FastAPI app
│   │   ├── predictor.py             # Model inference
│   │   └── duplicate_detector.py    # Image hashing
│   ├── training/
│   │   ├── train_classifier.py
│   │   ├── train_severity.py
│   │   └── data_preparation.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── datasets/                        # Training data (gitignore)
│   ├── raw/
│   ├── processed/
│   └── augmented/
│
├── docs/
│   ├── API.md
│   ├── SETUP.md
│   └── USER_GUIDE.md
│
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## AI MODEL ARCHITECTURE

### IMAGE CLASSIFICATION MODEL

**Input:** 224x224x3 RGB image

**Architecture:**
1. **MobileNetV2** (pre-trained on ImageNet, frozen)
   - Input: (224, 224, 3)
   - Output: (7, 7, 1280)

2. **Global Average Pooling 2D**
   - Output: (1280,)

3. **Dense Layer** (256 units, ReLU, Dropout 0.3)
   - Output: (256,)

4. **Dense Layer** (128 units, ReLU, Dropout 0.2)
   - Output: (128,)

5. **Output Layer** (6 units, Softmax)
   - Classes: [pothole, road_crack, garbage, streetlight, drainage, graffiti]
   - Output: (6,) probabilities

**Training Parameters:**
- Optimizer: Adam (lr=0.001)
- Loss: Categorical Crossentropy
- Batch Size: 32
- Epochs: 15-20
- Data Augmentation: rotation, flip, brightness, zoom

**Expected Accuracy:** 85-92% on validation set

### SEVERITY SCORING MODEL

**Input:** 224x224x3 RGB image + category embedding

**Architecture:**
1. MobileNetV2 feature extractor
2. Concatenate with category one-hot (6,)
3. Dense (64, ReLU)
4. Dense (1, Sigmoid) * 10

**Output:** Severity score 0-10

### DUPLICATE DETECTION

1. Generate perceptual hash (pHash) for each image
2. Store hash in database
3. On new submission:
   - Generate pHash
   - Query images within 100m radius
   - Calculate Hamming distance
   - If distance < 10 AND location < 50m → Potential duplicate

---

## AWARD-WINNING FEATURES

### 1. AI AUTO-CLASSIFICATION
- Instant category prediction on image upload
- Confidence score displayed to user
- Reduces manual categorization by 90%

### 2. SMART SEVERITY SCORING
- AI estimates urgency (1-10)
- Helps prioritize critical issues
- Transparent scoring shown to citizens

### 3. INTELLIGENT DUPLICATE DETECTION
- Prevents spam reports
- Groups related issues automatically
- Saves municipal time

### 4. PREDICTIVE HOTSPOT MAPPING
- Identifies problem areas before issues arise
- Enables proactive maintenance
- Uses historical data patterns

### 5. CIVIC GAMIFICATION
- Citizens earn "Civic Points" for valid reports
- Leaderboard encourages participation
- Badges for milestones (10 reports, first resolution, etc.)

### 6. TRANSPARENCY DASHBOARD
- Public view of government response times
- Before/After resolution gallery
- Builds trust and accountability

### 7. VOICE ACCESSIBILITY
- Voice-to-text for descriptions
- Accessible for visually impaired
- Supports multiple languages (future)

### 8. OFFLINE-FIRST PWA
- Works without internet
- Queues reports for sync
- Native app-like experience

---

## ESTIMATED HOURS BREAKDOWN

| Week | Component | Hours |
|------|-----------|-------|
| **Week 1** | Foundation | ~40 hours |
| | Project Setup | 4 |
| | Database & Auth | 6 |
| | Dataset Preparation | 8 |
| | AI Model Training | 12 |
| | FastAPI Microservice | 6 |
| | Integration | 4 |
| **Week 2** | Core Features | ~45 hours |
| | Issue Submission | 8 |
| | AI Integration Frontend | 6 |
| | Backend APIs | 8 |
| | Map Dashboard | 10 |
| | Real-time Updates | 8 |
| | Polish | 5 |
| **Week 3** | Admin Portal | ~45 hours |
| | Admin Auth & Dashboard | 8 |
| | Issue Management | 10 |
| | Auto-routing | 8 |
| | Department Portal | 8 |
| | Notifications | 8 |
| | Duplicate Management | 3 |
| **Week 4** | Analytics & Launch | ~40 hours |
| | Analytics Dashboard | 10 |
| | Heatmap & Hotspots | 6 |
| | PWA Features | 6 |
| | Testing & Bug Fixes | 8 |
| | Deployment | 6 |
| | Documentation | 4 |
| **TOTAL** | **~170 hours over 28 days = ~6 hours/day** |

---

## QUICK START COMMANDS

```bash
# Clone and setup
mkdir civic-sense-portal && cd civic-sense-portal

# Frontend
npm create vite@latest client -- --template react
cd client
npm install react-router-dom axios @tanstack/react-query leaflet react-leaflet
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..

# Backend
mkdir server && cd server
npm init -y
npm install express mongoose cors dotenv multer jsonwebtoken socket.io firebase-admin
npm install -D nodemon
cd ..

# AI Service
mkdir ai-service && cd ai-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install fastapi uvicorn tensorflow pillow imagehash python-multipart
cd ..

# MongoDB Atlas (Free Tier)
# 1. Go to https://www.mongodb.com/atlas/database
# 2. Create a free M0 cluster
# 3. Add your IP to allowed list
# 4. Create a database user
# 5. Copy the connection string to MONGODB_URI in your .env file
```

---

## SUCCESS METRICS

**Target Goals for Judges:**

| Metric | Target |
|--------|--------|
| AI Classification Accuracy | >85% |
| Page Load Time | <3 seconds |
| Image Upload + AI Response | <5 seconds |
| Mobile Lighthouse Score | >90 |
| API Response Time | <500ms average |
| Concurrent Users Supported | 100+ |
| Duplicate Detection Precision | >80% |

---

## CONTACT & RESOURCES

### Dataset Links
- **Pothole Dataset (YOLOv8):** `dataset/potholes/Pothole_Segmentation_YOLOv8/` (already downloaded)
- **Road Damage (India):** `dataset/road damage/India/` (already downloaded)
- **TACO:** `dataset/garbage/TACO/` (already downloaded)
- **Garbage Classification:** `dataset/garbage/archive/` (already downloaded)

### Helpful Tutorials
- **Transfer Learning:** https://www.tensorflow.org/tutorials/images/transfer_learning
- **FastAPI:** https://fastapi.tiangolo.com/tutorial/
- **Leaflet React:** https://react-leaflet.js.org/docs/start-introduction/
- **Firebase Auth:** https://firebase.google.com/docs/auth/web/start

### Free Hosting
- **Vercel (Frontend):** https://vercel.com
- **Railway (Backend):** https://railway.app
- **Cloudinary (Images):** https://cloudinary.com

---

## GOOD LUCK! YOU'VE GOT THIS! 🚀
