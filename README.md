# 🏙️ CityFix

**CityFix** is a full-stack civic issue reporting and management platform that helps citizens report problems in their city—such as potholes, broken street lights, garbage, and other public issues—while enabling municipal administrators to track, manage, and resolve them efficiently.

The platform provides **real-time status updates using Socket.io**, location-based issue reporting, duplicate detection, map visualization, notifications, and administrative analytics.

---

## 🎯 Why CityFix?

Citizens often face difficulties when reporting local problems, while municipal authorities may struggle to track and prioritize complaints.

CityFix aims to address these challenges by providing a centralized digital platform where:

* 📍 Citizens can report problems with photos and GPS location.
* 🔎 Nearby and duplicate issues can be identified.
* 👍 Citizens can upvote existing issues instead of creating duplicates.
* 🔄 Issue status can be tracked in real time.
* 🏛️ Administrators can manage, assign, and monitor complaints.
* 📊 Authorities can analyze issue categories and resolution rates.

---

## ✨ Features

### 👤 Citizen Side

* 📸 Report an issue with a photo, category, and location.
* 📍 Automatically capture GPS coordinates.
* 🗺️ View nearby reported issues on an interactive map.
* 🔎 Detect potentially duplicate issues nearby.
* 👍 Upvote an existing issue instead of submitting a duplicate.
* 🔄 Track report status in real time.
* 🔔 Receive notifications when the status changes.
* ⭐ Earn karma points for reporting civic issues.

### 🛡️ Admin Side

* 🔐 Separate administrator authentication.
* 📋 View and manage all reported issues.
* 🔍 Filter issues by:

  * Category
  * Status
  * Area
* 🗺️ View issues on an interactive map.
* 🔄 Update issue status.
* 🏢 Assign issues to departments.
* 📊 View analytics including:

  * Issues by category
  * Resolution rate
  * Issue distribution

---

## 🛠️ Tech Stack

| Category                | Technologies                                  |
| ----------------------- | --------------------------------------------- |
| Frontend                | React 18, Vite, Tailwind CSS                  |
| Maps                    | Leaflet, React-Leaflet                        |
| Backend                 | Node.js, Express.js                           |
| Real-Time Communication | Socket.io                                     |
| Authentication          | JWT, bcryptjs                                 |
| File Upload             | Multer                                        |
| Database                | SQLite (Development), PostgreSQL (Production) |
| API                     | REST API                                      |
| Version Control         | Git, GitHub                                   |

---

## 🔄 How CityFix Works

```text
Citizen
   │
   ▼
Report Issue
   │
   ├── Photo
   ├── Category
   └── GPS Location
   │
   ▼
JWT Authentication
   │
   ▼
Duplicate Detection
   │
   └── 75-meter radius
       using Haversine Formula
   │
   ▼
Save Issue
   │
   ▼
Database
   │
   ├── SQLite (Development)
   └── PostgreSQL (Production)
   │
   ▼
Socket.io
   │
   ├── Citizen Updates
   └── Admin Dashboard
   │
   ▼
Issue Management
   │
   ▼
Open → In Progress → Resolved
              │
              └── Reject (Invalid Report)
```

---

## 📍 Issue Reporting Workflow

1. A citizen captures a photo of a civic issue.
2. The application automatically attaches the user's GPS location.
3. JWT authentication verifies the logged-in user.
4. The server checks whether a similar issue already exists within **75 meters**.
5. The Haversine formula is used to calculate geographical distance.
6. If the issue is valid, it is stored in the database.
7. Socket.io broadcasts updates in real time.
8. Administrators can review, assign, and update the issue.
9. Citizens receive live status updates and notifications.

### Issue Status

```text
Open
  ↓
In Progress
  ↓
Resolved
```

Administrators can also **reject** invalid reports.

---

## 🗄️ Database

CityFix currently uses **6 main tables**:

| Table             | Purpose                           |
| ----------------- | --------------------------------- |
| `departments`     | Stores municipal departments      |
| `users`           | Stores citizen and admin accounts |
| `issues`          | Stores reported civic issues      |
| `timeline_events` | Stores issue status history       |
| `upvotes`         | Stores citizen upvotes            |
| `notifications`   | Stores user notifications         |

---

## 🔌 API Routes

| Method | Route                          | Description                       |
| ------ | ------------------------------ | --------------------------------- |
| POST   | `/api/auth/login`              | User login                        |
| POST   | `/api/auth/register`           | User registration                 |
| GET    | `/api/issues`                  | Get issues                        |
| GET    | `/api/issues/:id`              | Get a specific issue              |
| GET    | `/api/issues/nearby`           | Get nearby issues                 |
| GET    | `/api/issues/heatmap`          | Get issue heatmap data            |
| GET    | `/api/issues/check-duplicates` | Check for duplicate issues        |
| POST   | `/api/issues`                  | Create an issue with photo upload |
| PATCH  | `/api/issues/:id/status`       | Update issue status *(Admin)*     |
| POST   | `/api/issues/:id/upvote`       | Upvote an issue                   |
| GET    | `/api/analytics/overview`      | Get dashboard analytics           |

---

## 📂 Project Structure

```text
cityfix/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── uploads/
│   ├── package.json
│   └── ...
│
├── .gitignore
├── package.json
└── README.md
```

> The exact structure may vary depending on the current implementation.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/BVG-VARMA/CITYFIX.git
cd CITYFIX
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

### 3. Install Client Dependencies

Open another terminal or return to the project root:

```bash
cd ../client
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `server` folder:

```env
PORT=5000
JWT_SECRET=your_secret_key
```

⚠️ **Never commit your `.env` file to GitHub.**

Make sure your `.gitignore` contains:

```text
node_modules/
.env
.env.local
dist/
build/
*.log
```

---

## ▶️ Running the Application

### Start the Backend

```bash
cd server
npm run dev
```

The server will run on:

```text
http://localhost:5000
```

### Start the Frontend

Open another terminal:

```bash
cd client
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

Open the frontend URL in your browser.

---

## 🔮 Future Work

Planned improvements for CityFix include:

* 🏘️ Pilot deployment in a small neighborhood.
* 📱 Integration with SMS notifications.
* 🏛️ Integration with existing municipal systems.
* 🏆 Ward-level citizen leaderboard.
* 🤖 Further automation for issue verification and prioritization.
* 📊 Expanded civic analytics and reporting.

---

## 🔒 Security

CityFix uses several mechanisms to protect the application:

* JWT-based authentication
* Password hashing with bcryptjs
* Protected administrator routes
* Environment variables for sensitive configuration
* `.gitignore` protection for secrets and dependencies

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Project

**CityFix — Making Civic Issue Reporting Simple, Transparent, and Trackable.**

Built with ❤️ using **React, Node.js, Express, Socket.io, and SQLite/PostgreSQL**.
