# Civic Sense Portal — API Documentation

## Services

| Service | Local URL | Purpose |
|---------|-----------|---------|
| Node.js Backend | `http://localhost:5000` | Auth, Issues CRUD, Admin, Analytics |
| FastAPI AI Service | `http://localhost:8000` | DNN inference + Groq vision |

## Authentication

All protected backend endpoints require a Firebase ID token:

```
Authorization: Bearer <firebase_id_token>
```

---

## Node.js Backend (`/api`)

### Health

```
GET /api/health
```

**Response:**
```json
{ "status": "ok", "timestamp": "2025-03-07T..." }
```

---

### Auth Routes (`/api/auth`)

#### Register
```
POST /api/auth/register
```
**Body:**
```json
{
  "idToken": "firebase_id_token",
  "name": "Jane Citizen",
  "phone": "+91xxxxxxxxxx"   // optional
}
```
**Response `201`:**
```json
{
  "user": { "_id": "...", "email": "...", "name": "...", "role": "citizen", "civicPoints": 0 },
  "token": "<jwt>"
}
```

#### Login
```
POST /api/auth/login
```
**Body:**
```json
{ "idToken": "firebase_id_token" }
```
**Response `200`:**
```json
{
  "user": { "_id": "...", "email": "...", "name": "...", "role": "citizen" },
  "token": "<jwt>"
}
```

#### Get Profile
```
GET /api/auth/me
```
Requires `Authorization` header.

**Response `200`:**
```json
{
  "_id": "...", "email": "...", "name": "...", "role": "citizen",
  "civicPoints": 42, "avatarUrl": null, "createdAt": "..."
}
```

#### Update Profile
```
PUT /api/auth/me
```
Requires `Authorization` header.

**Body (partial):**
```json
{ "name": "Jane Updated", "phone": "+91xxxxxxxxxx" }
```

#### Delete Account
```
DELETE /api/auth/me
```
Requires `Authorization` header.

---

### Issues Routes (`/api/issues`) — to be built (Sprint Day 2)

#### Create Issue
```
POST /api/issues
Content-Type: multipart/form-data
```
Requires `Authorization` header.

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | file | ✅ | Issue photo (jpeg/png/webp, max 10MB) |
| `latitude` | number | ✅ | GPS latitude |
| `longitude` | number | ✅ | GPS longitude |
| `description` | string | — | User description (max 500 chars) |
| `category` | string | — | Manual override (`garbage`/`pothole`/`road_damage`) |

**Flow:**
1. Upload image to Cloudinary
2. POST to FastAPI `/predict` → get AI category, confidence, severity, pHash
3. Check for nearby duplicates (50m radius + pHash hamming < 10)
4. Save issue, auto-route to department
5. Return created issue

**Response `201`:**
```json
{
  "_id": "...",
  "userId": "...",
  "category": "pothole",
  "aiCategory": "pothole",
  "aiConfidence": 0.94,
  "aiSeverityScore": 0.991,
  "description": "Large pothole near school gate",
  "imageUrl": "https://res.cloudinary.com/...",
  "imageHash": "f8e0c4a0...",
  "location": { "type": "Point", "coordinates": [72.8777, 19.0760] },
  "status": "pending",
  "priority": "high",
  "assignedDepartment": "...",
  "upvotes": 0,
  "groqAnalysis": {
    "description": "A significant pothole...",
    "severity_reason": "Deep cavity risk to tyres...",
    "recommendation": "Immediate asphalt patching required"
  },
  "duplicateOf": null,
  "createdAt": "..."
}
```

#### List Issues
```
GET /api/issues
```
Public endpoint — no auth required.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | — | Filter by category |
| `status` | string | — | `pending`/`acknowledged`/`in_progress`/`resolved` |
| `lat` | number | — | Center latitude for geo query |
| `lng` | number | — | Center longitude for geo query |
| `radius` | number | 5000 | Radius in metres |
| `page` | number | 1 | Pagination |
| `limit` | number | 20 | Results per page (max 100) |
| `sort` | string | `-createdAt` | `-createdAt` / `-severity` / `-upvotes` |

**Response `200`:**
```json
{
  "issues": [ /* array of issue objects */ ],
  "total": 142,
  "page": 1,
  "pages": 8
}
```

#### Get Issue
```
GET /api/issues/:id
```
Public endpoint.

**Response `200`:** Full issue object + update history array.

#### Update Issue Status
```
PATCH /api/issues/:id/status
```
Requires `Authorization` header. Role: `admin` or `department_staff`.

**Body:**
```json
{
  "status": "in_progress",
  "comment": "Crew dispatched, work begins Monday",
  "isPublic": true
}
```

#### Upvote Issue
```
POST /api/issues/:id/upvote
```
Requires `Authorization` header. Idempotent — one upvote per user.

**Response `200`:** `{ "upvotes": 15 }`

---

### Admin Routes (`/api/admin`) — to be built (Sprint Day 4)

All admin routes require `Authorization` header + `role: admin`.

#### Get All Issues (Admin View)
```
GET /api/admin/issues
```
Full issue list with advanced filters. Returns `assignedDepartment` populated.

#### Assign Issue to Department
```
PATCH /api/admin/issues/:id/assign
```
**Body:** `{ "departmentId": "..." }`

#### Get All Departments
```
GET /api/admin/departments
```

#### Create Department
```
POST /api/admin/departments
```
**Body:** `{ "name": "PWD", "email": "pwd@city.gov", "phone": "...", "categories": ["pothole","road_damage"] }`

#### Get All Users
```
GET /api/admin/users
```

#### Update User Role
```
PATCH /api/admin/users/:id/role
```
**Body:** `{ "role": "department_staff", "departmentId": "..." }`

---

### Analytics Routes (`/api/analytics`) — to be built (Sprint Day 4)

Public read; no auth required.

#### Summary Stats
```
GET /api/analytics/summary
```
**Response:**
```json
{
  "total": 500,
  "byStatus": { "pending": 120, "in_progress": 80, "resolved": 300 },
  "byCategory": { "pothole": 200, "garbage": 180, "road_damage": 120 },
  "avgResolutionHours": 36.4,
  "resolvedLast7Days": 42
}
```

#### Issues Over Time
```
GET /api/analytics/timeline?days=30
```
Returns daily counts for charting.

#### Heatmap Data
```
GET /api/analytics/heatmap
```
Returns `[{ lat, lng, weight }]` array for Leaflet heatmap plugin.

---

## FastAPI AI Service (`http://localhost:8000`)

### Health
```
GET /health
```
**Response `200`:**
```json
{
  "status": "ok",
  "model_loaded": true,
  "groq_enabled": true
}
```

### Classes
```
GET /classes
```
**Response `200`:**
```json
{
  "classes": ["garbage", "pothole", "road_damage"],
  "severity_config": {
    "base_severity": { "garbage": 0.40, "pothole": 0.85, "road_damage": 0.65 },
    "confidence_boost": 0.15
  }
}
```

### Predict
```
POST /predict
Content-Type: multipart/form-data
```

**Form Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `file` | file | required | Image (jpeg/png/webp/gif) |
| `use_groq` | bool | `true` | Include Groq LLM analysis |

**Response `200`:**
```json
{
  "category": "pothole",
  "confidence": 0.9413,
  "severity_score": 0.9912,
  "all_probs": {
    "garbage": 0.0312,
    "pothole": 0.9413,
    "road_damage": 0.0275
  },
  "image_hash": "f8e0c4a0b2d1e3f5",
  "groq_analysis": {
    "description": "A severe pothole approximately 40cm wide and 10cm deep...",
    "severity_reason": "Deep cavity poses risk of tyre damage and potential accidents...",
    "recommendation": "Immediate cold-patch or asphalt repair required within 24 hours",
    "raw": "..."
  },
  "model_version": "mobilenetv2_phase2"
}
```

> `groq_analysis` is `null` when `use_groq=false` or `GROQ_API_KEY` is not set.

**Error Responses:**

| Code | Body | Cause |
|------|------|-------|
| `400` | `{ "detail": "Cannot decode image" }` | Corrupt / non-image file |
| `503` | `{ "detail": "Model not loaded" }` | Service starting up |

---

## Duplicate Detection Logic (Backend)

When a new issue is created:

1. **pHash proximity** — query issues where `imagehash.hamming(newHash, existingHash) < 10`
2. **Geo proximity** — `$near` MongoDB query, `$maxDistance: 50` metres
3. If both conditions match → mark `duplicateOf: <masterId>` and return `{ duplicate: true, master: <issue> }` in response

---

## Error Response Format

All errors follow:
```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

| HTTP | Code | Meaning |
|------|------|---------|
| 400 | `VALIDATION_ERROR` | Missing/invalid request fields |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient role |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `DUPLICATE_ISSUE` | Likely duplicate detected |
| 500 | `SERVER_ERROR` | Unexpected server error |
