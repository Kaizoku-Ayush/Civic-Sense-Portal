# 🏛️ Civic Sense Portal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-blue)](https://www.python.org/)

**AI-Powered Crowdsourced Civic Issue Reporting System**

An innovative platform that leverages Deep Neural Networks and AI to help citizens report civic issues (potholes, broken streetlights, garbage overflow) and enables municipalities to efficiently track and resolve them.

## 🌟 Key Features

- 🤖 **AI Auto-Classification**: Instant image classification using MobileNetV2
- 📊 **Smart Severity Scoring**: AI-powered urgency estimation
- 🔍 **Duplicate Detection**: Intelligent image hashing and geolocation clustering
- 🗺️ **Interactive Map Dashboard**: Real-time issue visualization with Leaflet.js
- 📱 **Progressive Web App (PWA)**: Works offline, installable on mobile
- 🎯 **Predictive Hotspot Mapping**: Proactive maintenance insights
- 🏆 **Civic Gamification**: Points and leaderboards to encourage participation
- 📈 **Transparency Dashboard**: Public government response time tracking

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite, Tailwind CSS, Leaflet.js |
| **Backend** | Node.js + Express, PostgreSQL + PostGIS |
| **AI Service** | Python FastAPI, TensorFlow, MobileNetV2 |
| **Real-time** | Socket.io |
| **Auth** | Firebase Auth |
| **Storage** | Cloudinary |
| **Deployment** | Vercel (Frontend), Railway (Backend) |

## 📂 Project Structure

```
civic-sense-portal/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Helper functions
│   └── package.json
│
├── server/              # Node.js backend
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   └── package.json
│
├── ai-service/          # Python AI microservice
│   ├── app/             # FastAPI application
│   ├── models/          # Trained ML models
│   └── training/        # Training scripts
│
└── docs/                # Documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- Python 3.10 or higher
- PostgreSQL 14+ with PostGIS extension
- npm or yarn

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

4. **Setup AI Service** (Optional for Day 1)
   ```bash
   cd ai-service
   python -m venv venv
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

5. **Setup Database**
   ```bash
   psql -U postgres
   CREATE DATABASE civic_sense;
   \c civic_sense
   CREATE EXTENSION postgis;
   ```

## 📖 Development Roadmap

This project follows a 4-week development plan:

- **Week 1**: Foundation (Database, Auth, AI Model Training)
- **Week 2**: Core Features (Issue Submission, Map Dashboard)
- **Week 3**: Admin Portal (Management, Routing, Notifications)
- **Week 4**: Analytics & Launch (Charts, PWA, Deployment)

See [ROADMAP.md](ROADMAP.md) for detailed day-by-day tasks.

## 🎯 Problem Statement

**ID**: 25031  
**Title**: Crowdsourced Civic Issue Reporting and Resolution System

Local governments face challenges in identifying and resolving civic issues. This platform empowers citizens to report issues with photos and location data while providing municipalities with powerful tools to track, prioritize, and resolve them efficiently.

## 📊 AI/ML Features

### 1. Image Classification
- **Model**: MobileNetV2 with transfer learning
- **Classes**: Pothole, Road Crack, Garbage, Streetlight, Drainage, Graffiti
- **Accuracy Target**: >85%

### 2. Severity Scoring
- **Input**: Image + Category
- **Output**: Urgency score (1-10)
- **Use**: Prioritization automation

### 3. Duplicate Detection
- **Method**: Perceptual hashing + Geolocation
- **Threshold**: Hamming distance < 10, Location < 50m

## 📚 Datasets Used

1. **RDD2022** - Road Damage Dataset (47,000+ images)
2. **TACO** - Trash Annotations in Context (15,000+ annotations)
3. **Garbage Classification** - Kaggle (15,000+ images)

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
