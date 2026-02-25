# CIVIC SENSE PORTAL - COMPLETE PROJECT ROADMAP
## AI-Powered Crowdsourced Civic Issue Reporting System

| Property | Value |
|----------|-------|
| Project Type | Web Application (Progressive Web App - PWA) |
| Duration | 4 Weeks |
| Start Date | February 2, 2026 |
| End Date | March 1, 2026 |

---

## TECH STACK

### FRONTEND
- React.js 18+ (Vite for fast builds)
- Tailwind CSS (styling)
- Leaflet.js (interactive maps)
- PWA features (service worker, manifest)
- Axios (API calls)
- React Query (data fetching/caching)

### BACKEND
- Node.js + Express.js
- MongoDB + Mongoose (with 2dsphere indexes for geospatial queries)
- Socket.io (real-time updates)
- Multer (file uploads)
- JWT (authentication)

### AI/ML MICROSERVICE
- Python 3.10+
- FastAPI (REST API for AI)
- TensorFlow/Keras (image classification)
- MobileNetV2 (pre-trained base model)
- OpenCV (image preprocessing)
- ImageHash (duplicate detection)

### CLOUD SERVICES (FREE TIER)
- Firebase Auth (authentication)
- Cloudinary (image storage - 25GB free)
- Railway/Render (backend hosting)
- Vercel (frontend hosting)
- Hugging Face Spaces (AI model hosting - optional)

---

## DATASETS TO USE

### DATASET 1: RDD2022 (Road Damage Dataset)

| Attribute | Details |
|-----------|---------|
| **Purpose** | Pothole and road damage classification |
| **Size** | 47,000+ images |
| **Format** | PASCAL VOC / COCO |
| **Classes** | D00 (Longitudinal Crack), D10 (Transverse Crack), D20 (Alligator Crack), D40 (Pothole) |
| **Download** | https://github.com/sekilab/RoadDamageDetector |
| **License** | CC BY-SA 4.0 (Free for academic use) |
| **Usage** | Sample 4000-5000 images for training |

### DATASET 2: TACO (Trash Annotations in Context)

| Attribute | Details |
|-----------|---------|
| **Purpose** | Garbage and litter detection |
| **Size** | 15,000+ annotations on 1,500 images |
| **Format** | COCO |
| **Classes** | 60 categories (bottles, cans, bags, etc.) |
| **Download** | http://tacodataset.org/ |
| **License** | CC BY 4.0 (Free) |
| **Usage** | Use all images, group into "garbage" super-category |

### DATASET 3: Garbage Classification (Kaggle)

| Attribute | Details |
|-----------|---------|
| **Purpose** | Waste type classification |
| **Size** | 15,000+ images |
| **Format** | Folder-based (easy to use) |
| **Classes** | cardboard, glass, metal, paper, plastic, trash |
| **Download** | https://www.kaggle.com/datasets/asdasdasasdas/garbage-classification |
| **License** | CC0 (Public Domain) |
| **Usage** | Merge with TACO for robust garbage detection |

### COMBINED DATASET STRUCTURE

```
civic_dataset/
├── pothole/          (~2500 images from RDD2022 D40 class)
├── road_crack/       (~2000 images from RDD2022 D00,D10,D20)
├── garbage/          (~3000 images from TACO + Kaggle)
├── streetlight/      (~300 images - manual collection needed)
├── drainage/         (~300 images - manual collection needed)
└── graffiti/         (~300 images - manual collection/scraping)
```

**Total: ~8400 images** (sufficient for transfer learning)

> **NOTE:** For streetlight, drainage, graffiti - collect 50-100 real images and use data augmentation (rotation, flip, brightness) to reach 300.

---

## 4-WEEK DETAILED ROADMAP

### WEEK 1: FOUNDATION (Feb 2 - Feb 8, 2026)

#### DAY 1 (Feb 2) - Project Setup

**Morning:**
- [ ] Create project folder structure
- [ ] Initialize React app with Vite: `npm create vite@latest client`
- [ ] Initialize Node.js backend: `npm init`
- [ ] Create MongoDB Atlas account (free M0 cluster at mongodb.com/atlas)
- [ ] Get MongoDB connection string

**Afternoon:**
- [ ] Setup Git repository
- [ ] Create .gitignore, README.md
- [ ] Install core dependencies:
  - Frontend: react-router-dom, axios, tailwindcss, leaflet
  - Backend: express, mongoose, cors, dotenv, multer, jsonwebtoken

**Evening:**
- [ ] Configure Tailwind CSS
- [ ] Create basic folder structure:
  ```
  client/src/components/
  client/src/pages/
  client/src/services/
  server/routes/
  server/controllers/
  server/models/
  ```

#### DAY 2 (Feb 3) - Database & Auth

**Morning:**
- [ ] Define Mongoose schemas (User, Issue, Department - see SCHEMA section)
- [ ] Create model files in `server/models/`
- [ ] Test MongoDB connection

**Afternoon:**
- [ ] Setup Firebase Auth project
- [ ] Implement Firebase Auth in React
- [ ] Create Login/Register pages
- [ ] Create auth middleware for backend

**Evening:**
- [ ] Test auth flow end-to-end
- [ ] Setup protected routes in React

#### DAY 3 (Feb 4) - Prepare & Explore Datasets

**Morning:**
- [ ] Explore pothole dataset: `dataset/potholes/Pothole_Segmentation_YOLOv8/`
- [ ] Explore road damage dataset: `dataset/road damage/India/`
- [ ] Explore garbage datasets: `dataset/garbage/TACO/` and `dataset/garbage/archive/`

**Afternoon:**
- [ ] Write Python script to convert all datasets to a unified classification format
- [ ] Sample and balance classes across 3 categories (pothole, road_damage, garbage)
- [ ] Create train/validation/test splits (70/15/15)

**Evening:**
- [ ] Verify unified dataset structure
- [ ] Calculate class distribution
- [ ] Plan augmentation strategy for smaller classes (pothole, road_damage)

#### DAY 4 (Feb 5) - AI Model Training (Part 1)

**Morning:**
- [ ] Setup Python environment (venv)
- [ ] Install TensorFlow, Keras, OpenCV, NumPy
- [ ] Write data loading pipeline with ImageDataGenerator

**Afternoon:**
- [ ] Load MobileNetV2 pre-trained model
- [ ] Add custom classification head (6 classes)
- [ ] Configure transfer learning (freeze base layers)

**Evening:**
- [ ] Start training (10-15 epochs)
- [ ] Monitor accuracy/loss curves
- [ ] Save initial model checkpoint

#### DAY 5 (Feb 6) - AI Model Training (Part 2)

**Morning:**
- [ ] Evaluate model on validation set
- [ ] Fine-tune if needed (unfreeze top layers)
- [ ] Apply data augmentation for low-accuracy classes

**Afternoon:**
- [ ] Train severity scoring model (regression head)
- [ ] Test model on sample images
- [ ] Export model to .h5 and TensorFlow SavedModel format

**Evening:**
- [ ] Convert to TFLite (optional, for mobile)
- [ ] Document model performance metrics
- [ ] Save final model files

#### DAY 6 (Feb 7) - FastAPI AI Microservice

**Morning:**
- [ ] Setup FastAPI project structure
- [ ] Create /predict endpoint
- [ ] Load trained model in memory

**Afternoon:**
- [ ] Implement image preprocessing pipeline
- [ ] Add severity scoring endpoint
- [ ] Implement image hash generation for duplicates

**Evening:**
- [ ] Test all endpoints with Postman/Thunder Client
- [ ] Add error handling
- [ ] Write Dockerfile for AI service

#### DAY 7 (Feb 8) - Integration & Week 1 Review

**Morning:**
- [ ] Connect React frontend to Node.js backend
- [ ] Connect Node.js to FastAPI AI service
- [ ] Test end-to-end image upload + classification

**Afternoon:**
- [ ] Fix any integration bugs
- [ ] Optimize API response times
- [ ] Setup environment variables properly

**Evening:**
- [ ] Week 1 code review and cleanup
- [ ] Update documentation
- [ ] Plan Week 2 tasks in detail

**✓ WEEK 1 DELIVERABLES:**
- Working auth system
- Database setup with schema
- Trained AI classification model (>85% accuracy target)
- FastAPI microservice running locally
- Basic React app structure

---

### WEEK 2: CORE FEATURES (Feb 9 - Feb 15, 2026)

#### DAY 8 (Feb 9) - Issue Submission Form

**Morning:**
- [ ] Create IssueForm component
- [ ] Implement image upload with preview
- [ ] Add drag-and-drop support

**Afternoon:**
- [ ] Integrate browser geolocation API
- [ ] Create location picker map component
- [ ] Add manual location adjustment option

**Evening:**
- [ ] Add form validation
- [ ] Implement description textarea
- [ ] Add category dropdown (manual override option)

#### DAY 9 (Feb 10) - AI Integration in Frontend

**Morning:**
- [ ] Call AI service on image upload
- [ ] Display predicted category with confidence
- [ ] Show severity score visualization

**Afternoon:**
- [ ] Add "AI Suggestion" UI component
- [ ] Allow user to confirm/change AI prediction
- [ ] Show loading state during AI processing

**Evening:**
- [ ] Handle AI service errors gracefully
- [ ] Add retry mechanism
- [ ] Test with various image types

#### DAY 10 (Feb 11) - Issue Submission Backend

**Morning:**
- [ ] Create POST /api/issues endpoint
- [ ] Implement Cloudinary image upload
- [ ] Save issue to database

**Afternoon:**
- [ ] Implement duplicate detection logic:
  - Check image hash similarity (hamming distance < 10)
  - Check geographic proximity (< 50 meters)
  - Return warning if potential duplicate found

**Evening:**
- [ ] Add issue status workflow (PENDING → ACKNOWLEDGED → IN_PROGRESS → RESOLVED)
- [ ] Create issue update endpoint
- [ ] Test full submission flow

#### DAY 11 (Feb 12) - Interactive Map Dashboard

**Morning:**
- [ ] Setup Leaflet.js in React
- [ ] Create MapView component
- [ ] Display all issues as markers

**Afternoon:**
- [ ] Implement marker clustering for dense areas
- [ ] Add custom marker icons per category
- [ ] Create marker popup with issue details

**Evening:**
- [ ] Add map filters (by category, status, date)
- [ ] Implement "locate me" button
- [ ] Add heatmap layer option

#### DAY 12 (Feb 13) - Issue List & Details

**Morning:**
- [ ] Create IssueList component with cards
- [ ] Implement infinite scroll/pagination
- [ ] Add sorting (newest, severity, distance)

**Afternoon:**
- [ ] Create IssueDetail page
- [ ] Show full issue info, image, map
- [ ] Display AI analysis results

**Evening:**
- [ ] Add status timeline component
- [ ] Implement "My Reports" page for logged-in users
- [ ] Add share functionality

#### DAY 13 (Feb 14) - Real-time Updates

**Morning:**
- [ ] Setup Socket.io on backend
- [ ] Implement connection handling
- [ ] Create room-based subscriptions

**Afternoon:**
- [ ] Push new issue notifications to map
- [ ] Update issue status in real-time
- [ ] Add notification toast component

**Evening:**
- [ ] Implement "watching" feature for issues
- [ ] Add browser push notifications (PWA)
- [ ] Test real-time sync across tabs

#### DAY 14 (Feb 15) - Week 2 Polish & Review

**Morning:**
- [ ] Code cleanup and refactoring
- [ ] Fix UI/UX issues
- [ ] Mobile responsiveness check

**Afternoon:**
- [ ] Performance optimization
- [ ] Add loading skeletons
- [ ] Implement error boundaries

**Evening:**
- [ ] Week 2 testing session
- [ ] Document API endpoints
- [ ] Plan admin portal features

**✓ WEEK 2 DELIVERABLES:**
- Complete issue submission with AI auto-classification
- Interactive map with all issues
- Issue list and detail views
- Real-time updates
- Mobile-responsive UI

---

### WEEK 3: ADMIN PORTAL (Feb 16 - Feb 22, 2026)

#### DAY 15 (Feb 16) - Admin Authentication

**Morning:**
- [ ] Add user roles (CITIZEN, ADMIN, DEPARTMENT_STAFF)
- [ ] Create admin login page
- [ ] Implement role-based route protection

**Afternoon:**
- [ ] Create admin dashboard layout
- [ ] Add sidebar navigation
- [ ] Implement admin-only API middleware

**Evening:**
- [ ] Setup department user accounts
- [ ] Create user management page (admin only)
- [ ] Test role-based access

#### DAY 16 (Feb 17) - Admin Issue Management

**Morning:**
- [ ] Create admin issue table view
- [ ] Add advanced filters (status, category, date range, location)
- [ ] Implement bulk selection

**Afternoon:**
- [ ] Add issue assignment functionality
- [ ] Create department dropdown
- [ ] Implement bulk status update

**Evening:**
- [ ] Add priority override option
- [ ] Create issue notes/comments system
- [ ] Implement internal communication thread

#### DAY 17 (Feb 18) - Auto-Routing Engine

**Morning:**
- [ ] Define routing rules in database
- [ ] Create routing_rules table
- [ ] Map categories to departments

**Afternoon:**
- [ ] Implement auto-routing on issue creation
- [ ] Add location-based routing (zones)
- [ ] Create routing override option for admins

**Evening:**
- [ ] Test routing with various scenarios
- [ ] Add routing history log
- [ ] Create routing rules management UI

#### DAY 18 (Feb 19) - Department Portal

**Morning:**
- [ ] Create department staff dashboard
- [ ] Show only assigned issues
- [ ] Add workload summary

**Afternoon:**
- [ ] Implement status update workflow
- [ ] Add photo upload for resolution proof
- [ ] Create resolution notes field

**Evening:**
- [ ] Add issue transfer between departments
- [ ] Implement SLA warnings (issues pending > 48 hours)
- [ ] Create department performance metrics

#### DAY 19 (Feb 20) - Notifications System

**Morning:**
- [ ] Create notifications table
- [ ] Implement in-app notifications
- [ ] Add notification preferences

**Afternoon:**
- [ ] Setup email notifications (Nodemailer + Gmail/SendGrid)
- [ ] Create email templates (confirmation, status update, resolution)
- [ ] Add email queue for batch sending

**Evening:**
- [ ] Implement PWA push notifications
- [ ] Add notification center UI
- [ ] Test all notification channels

#### DAY 20 (Feb 21) - Duplicate Management

**Morning:**
- [ ] Create duplicate detection dashboard
- [ ] Show potential duplicate pairs
- [ ] Add merge functionality

**Afternoon:**
- [ ] Implement master/duplicate relationship
- [ ] Auto-notify users of merged reports
- [ ] Add manual duplicate marking

**Evening:**
- [ ] Create duplicate report view
- [ ] Add "related issues" section
- [ ] Test duplicate clustering

#### DAY 21 (Feb 22) - Week 3 Review

**Morning:**
- [ ] Full admin portal testing
- [ ] Fix critical bugs
- [ ] Security audit (SQL injection, XSS)

**Afternoon:**
- [ ] Performance testing with mock data
- [ ] Load testing with Artillery/k6
- [ ] Optimize slow queries

**Evening:**
- [ ] Documentation update
- [ ] Create admin user guide
- [ ] Plan analytics features

**✓ WEEK 3 DELIVERABLES:**
- Complete admin portal
- Auto-routing engine
- Department staff portal
- Notification system (email + push)
- Duplicate detection and management

---

### WEEK 4: ANALYTICS & LAUNCH (Feb 23 - Mar 1, 2026)

#### DAY 22 (Feb 23) - Analytics Dashboard

**Morning:**
- [ ] Create analytics page layout
- [ ] Implement issues over time chart (Line chart)
- [ ] Add category distribution (Pie chart)

**Afternoon:**
- [ ] Create resolution time metrics
- [ ] Add department performance comparison
- [ ] Implement trend analysis

**Evening:**
- [ ] Add date range selector
- [ ] Create exportable reports (CSV/PDF)
- [ ] Add key metrics cards (total issues, avg resolution time, etc.)

#### DAY 23 (Feb 24) - Heatmap & Hotspots

**Morning:**
- [ ] Implement issue density heatmap
- [ ] Add temporal heatmap (issues by hour/day)
- [ ] Create hotspot detection algorithm

**Afternoon:**
- [ ] Add predictive hotspot highlighting
- [ ] Create "problem areas" report
- [ ] Implement zone-based analytics

**Evening:**
- [ ] Add comparison view (this month vs last month)
- [ ] Create ward/area-wise breakdown
- [ ] Test analytics accuracy

#### DAY 24 (Feb 25) - Public Transparency Dashboard

**Morning:**
- [ ] Create public analytics page (no login required)
- [ ] Show city-wide statistics
- [ ] Add leaderboard (most active citizens)

**Afternoon:**
- [ ] Implement "Before/After" gallery
- [ ] Add government response time transparency
- [ ] Create monthly report generator

**Evening:**
- [ ] Add social sharing for resolved issues
- [ ] Create embeddable widgets
- [ ] Add API documentation for integrations

#### DAY 25 (Feb 26) - PWA Features

**Morning:**
- [ ] Create manifest.json
- [ ] Add app icons (all sizes)
- [ ] Configure service worker

**Afternoon:**
- [ ] Implement offline mode
- [ ] Add offline issue queue
- [ ] Sync queued issues when online

**Evening:**
- [ ] Add "Add to Home Screen" prompt
- [ ] Test PWA on mobile devices
- [ ] Verify PWA audit score (Lighthouse)

#### DAY 26 (Feb 27) - Testing & Bug Fixes

**Morning:**
- [ ] Full application testing
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing

**Afternoon:**
- [ ] Fix critical bugs
- [ ] Performance optimization
- [ ] Security hardening

**Evening:**
- [ ] User acceptance testing
- [ ] Get feedback from test users
- [ ] Prioritize final fixes

#### DAY 27 (Feb 28) - Deployment

**Morning:**
- [ ] Deploy MongoDB Atlas cluster (free M0 tier at mongodb.com/atlas)
- [ ] Deploy Node.js backend to Railway/Render
- [ ] Deploy FastAPI to Railway/Hugging Face Spaces

**Afternoon:**
- [ ] Deploy React frontend to Vercel
- [ ] Configure custom domain (optional)
- [ ] Setup environment variables in production

**Evening:**
- [ ] Full production testing
- [ ] Monitor error logs
- [ ] Fix any deployment issues

#### DAY 28 (Mar 1) - Documentation & Demo

**Morning:**
- [ ] Create demo video (5-7 minutes)
- [ ] Prepare presentation slides
- [ ] Write project documentation

**Afternoon:**
- [ ] Create user guide
- [ ] Document API endpoints
- [ ] Prepare Q&A for judges

**Evening:**
- [ ] Final review
- [ ] Backup all code and data
- [ ] **CELEBRATE! 🎉**

**✓ WEEK 4 DELIVERABLES:**
- Analytics dashboard with charts
- Heatmap and hotspot analysis
- Public transparency dashboard
- Full PWA functionality
- Production deployment
- Demo video and documentation

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
