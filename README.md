# 🛡️ Threadline – Behavioural Security Operations Center

**An AI/ML-powered behavioural security monitoring platform for detecting suspicious login activities and identifying abnormal user behaviour.**

Threadline is a cybersecurity platform designed to go beyond traditional password-based authentication by analysing user login patterns and identifying potentially suspicious activities.

It combines **rule-based risk detection** with **Machine Learning-based anomaly detection using Isolation Forest** to assess login behaviour and provide security insights through an interactive dashboard.

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Our Solution](#-our-solution)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [System Architecture](#-system-architecture)
- [How It Works](#-how-it-works)
- [Risk Detection Mechanism](#-risk-detection-mechanism)
- [Project Structure](#-project-structure)
- [Requirements](#-requirements)
- [Installation and Setup](#-installation-and-setup)
- [Presentation Demo](#-presentation-demo)
- [Database Structure](#-database-structure)
- [API Overview](#-api-overview)
- [Validation and Build](#-validation-and-build)
- [Future Enhancements](#-future-enhancements)
- [Security Considerations](#-security-considerations)
- [Contributors](#-contributors)

---

## 📖 Overview

Traditional authentication systems primarily verify whether a user's username and password are correct. However, valid credentials do not always guarantee that the person accessing an account is legitimate.

For example:

- A user usually logs in from Delhi but suddenly accesses the account from another location.
- A login attempt occurs using an unfamiliar device or browser.
- Multiple failed login attempts occur within a short period.
- A user logs in at an unusual time compared to their historical activity.

Such activities may indicate compromised credentials or potentially suspicious behaviour.

**Threadline aims to identify these unusual patterns by analysing behavioural login characteristics and calculating risk scores.**

The platform provides administrators with a centralised dashboard to monitor login activities, analyse risks and review security alerts.

## 🎯 Problem Statement

Traditional authentication mechanisms are often limited to credential verification and may not adequately identify suspicious activities associated with legitimate login credentials.

There is a need for a behaviour-aware security monitoring solution that can analyse login patterns, detect anomalies and help administrators identify potentially risky activities.

## 💡 Our Solution

Threadline addresses this challenge through a combination of:

1. **Behavioural Analysis:** Studies login characteristics such as IP address, device, browser, location and login time.
2. **Rule-Based Detection:** Applies predefined security rules to identify suspicious login conditions.
3. **Machine Learning:** Uses the Isolation Forest algorithm to identify unusual login patterns.
4. **Risk Assessment:** Combines detection signals to calculate a risk score.
5. **Security Dashboard:** Presents login statistics, risk distribution and security alerts in a centralised interface.

---

## ✨ Key Features

### 🔐 Authentication and Access Management
- User registration and login.
- Secure password hashing using bcrypt.
- JWT-based session authentication.
- HTTP-only cookie-based session handling.
- Role-based access for administrators and users.

### 🔍 Behavioural Login Monitoring
- Login-time analysis.
- IP address change detection.
- Device and browser change detection.
- Location change detection.
- Failed login attempt monitoring.
- Login frequency analysis.
- Historical login behaviour comparison.

### 🤖 Machine Learning-Based Anomaly Detection
- Custom Isolation Forest implementation in TypeScript.
- Unsupervised anomaly detection.
- Historical feature analysis.
- Anomaly score generation.
- Integration with rule-based risk assessment logic.

### 📊 Risk Analysis Dashboard
- Login activity overview.
- Successful and failed login statistics.
- Low, medium and high-risk classification.
- User-wise risk analysis.
- Behavioural detection signal visualisation.
- Security alert monitoring.

### 🚨 Security Alert Management
- Alert severity classification.
- Alert status tracking.
- Open, reviewed and dismissed alert states.
- Security event monitoring.

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Frontend | Next.js, React |
| Programming Language | TypeScript |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Machine Learning | Isolation Forest |
| Authentication | JWT, bcrypt |
| Styling | Tailwind CSS |
| Data Visualisation | Recharts |
| Package Management | npm |
| Architecture | npm Workspace Monorepo |

---

## 🏗️ System Architecture

Threadline follows a frontend-backend-database architecture with a dedicated risk detection engine.

```text
              USER
                |
                v
       NEXT.JS + REACT
          FRONTEND
                |
                v
         REST API LAYER
                |
                v
        EXPRESS BACKEND
                |
         +------+------+
         |             |
         v             v
      MONGODB      RISK ENGINE
         |             |
         |        +----+-----+
         |        |          |
         |        v          v
         |    RULE-BASED  ISOLATION
         |    DETECTION    FOREST
         |        |          |
         |        +----+-----+
         |             |
         |             v
         |       RISK ASSESSMENT
         |             |
         +-------------+
                |
                v
        SECURITY DASHBOARD
                |
                v
       ALERTS AND ANALYTICS
```

### Architecture Components

| Component | Responsibility |
|---|---|
| Frontend | User interface, authentication and dashboard |
| Backend | API handling and application logic |
| MongoDB | Stores users, login events and alerts |
| Risk Engine | Evaluates login behaviour |
| Rule-Based Detection | Checks predefined security conditions |
| Isolation Forest | Identifies behavioural anomalies |
| Dashboard | Displays security analytics and alerts |

---

## ⚙️ How It Works

Threadline follows a structured workflow:

**Step 1 – User Authentication**

The user enters login credentials through the frontend. The backend verifies the credentials and manages the authenticated session.

**Step 2 – Login Behaviour Analysis**

Login-related characteristics such as time, IP address, device, browser and location are used as behavioural indicators.

**Step 3 – Historical Behaviour Comparison**

The system uses available historical login records to establish a baseline of normal user behaviour.

**Step 4 – Rule-Based Detection**

Predefined security rules evaluate suspicious conditions, such as repeated failed attempts, new IP addresses, unfamiliar devices and unusual login hours.

**Step 5 – Machine Learning Analysis**

The Isolation Forest algorithm analyses numerical login features and identifies potential anomalies.

**Step 6 – Risk Assessment**

Rule-based and ML-derived risk values are combined when ML scoring is available. The system assigns a risk category.

**Step 7 – Dashboard and Alerts**

The dashboard presents the available login statistics, risk analysis and security alerts to administrators.

---

## 🧠 Risk Detection Mechanism

Threadline uses two complementary approaches to evaluate login behaviour.

### 1. Rule-Based Risk Detection

The rule engine evaluates predefined conditions.

Examples of behavioural indicators include:

| Detection Signal | Example |
|---|---|
| Failed Attempts | Multiple failed login attempts |
| IP Change | Login from an unfamiliar IP |
| Device Change | Login using a new device |
| Browser Change | Login using an unfamiliar browser |
| Location Change | Login from a new location |
| Unusual Login Hour | Login outside the user's usual pattern |

Each detected condition contributes to the rule-based risk score according to its configured weight.

### 2. Isolation Forest – Machine Learning

Isolation Forest is an unsupervised Machine Learning algorithm used for anomaly detection.

It works by randomly partitioning data points using multiple isolation trees.

Unusual data points generally require fewer splits to become isolated, making them easier to identify as potential anomalies.

**The implementation includes:**
- Feature standardisation.
- Random feature selection.
- Random split generation.
- Isolation tree construction.
- Average path length calculation.
- Anomaly score generation.

### 3. Risk Classification

The project uses the following risk categories:

| Risk Score | Classification | Interpretation |
|---|---|---|
| 0–30 | 🟢 Low | Lower assessed risk |
| 31–70 | 🟡 Medium | Moderate assessed risk |
| 71–100 | 🔴 High | Higher assessed risk |

*Note: Risk scores represent the system's assessment of unusual login behaviour. They are not probabilities of a successful cyberattack.*

---

## 📁 Project Structure

Threadline is organised as an npm workspace monorepo.

```text
Threadline/
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── login/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx
│   │   │       ├── activity/
│   │   │       ├── threats/
│   │   │       ├── risk/
│   │   │       ├── users/
│   │   │       └── settings/
│   │   │
│   │   └── components/
│   │       ├── AuthContext.tsx
│   │       ├── DashboardProvider.tsx
│   │       ├── Charts.tsx
│   │       ├── types.ts
│   │       └── useApi.ts
│   │
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   ├── alerts/
│   │   │   ├── dashboard/
│   │   │   ├── logins/
│   │   │   ├── risk-analysis/
│   │   │   └── users/
│   │   │
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   │
│   │   └── lib/
│   │       ├── ml/
│   │       │   ├── riskEngine.ts
│   │       │   └── isolationForest.ts
│   │       ├── auth.ts
│   │       ├── api.ts
│   │       └── queries.ts
│   │
│   └── package.json
│
├── .env.example
├── package.json
└── README.md
```

### Important Modules

| File | Purpose |
|---|---|
| `riskEngine.ts` | Behavioural analysis and risk calculation |
| `isolationForest.ts` | Machine Learning anomaly detection |
| `auth.ts` | Password hashing and session authentication |
| `schema.ts` | Database schema definitions |
| `queries.ts` | Database query and analytics operations |
| `server.ts` | Express backend server |
| `AuthContext.tsx` | Frontend authentication state |
| `useApi.ts` | API data fetching hook |
| `Charts.tsx` | Dashboard data visualisation |

---

## 💻 Requirements

Before running the application, ensure that the following are installed:

- Node.js 20.9 or newer.
- npm.
- MongoDB Atlas account or a local MongoDB server.
- Git.
- Visual Studio Code or any preferred code editor.

---

## 🚀 Installation and Setup

Follow these steps to run Threadline locally on Windows or macOS.

### Step 1 – Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Navigate to the project directory:

```bash
cd Threadline
```

### Step 2 – Configure Environment Variables

Copy the root environment template:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Open the `.env` file and configure the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=threadline

JWT_SECRET=your_unique_random_secret

BACKEND_PORT=4000
FRONTEND_URL=http://localhost:3000
```

Replace the MongoDB connection string with your actual database connection string.

Generate a strong, unique JWT secret before running the application.

The application uses the database named by `MONGODB_DB`, which defaults to `threadline`.

### Step 3 – Install Dependencies

Run the following command from the project root:

```bash
npm install
```

This installs the dependencies for both frontend and backend workspaces.

### Step 4 – Start the Application

```bash
npm run dev
```

This starts both the frontend and backend development servers.

### Step 5 – Open Threadline

Open your browser and visit:

**Frontend:**

http://localhost:3000

**Backend:**

http://localhost:4000

The frontend proxies `/api` requests to the Express backend.

If you change the backend port, update `BACKEND_PORT` in the root `.env` and `BACKEND_URL` in `frontend/.env.local`.

If the backend is accessed from a different frontend origin, configure `FRONTEND_URL` accordingly.

---

## 🎬 Presentation Demo

Threadline includes a presentation demo mode that allows the dashboard to display simulated login events and security alerts.

### Step 1 – Enable Demo Mode

Add the following variable to the root `.env` file:

```env
DEMO_MODE=true
```

### Step 2 – Generate Demo Data

From the project root, run:

```bash
npm run seed:demo
```

This creates or refreshes two demo accounts and their associated simulated login events and alerts.

### Step 3 – Demo Login Credentials

| Username | Role | Password |
|---|---|---|
| `demo-admin` | Admin | `ThreadlineDemo2026!` |
| `demo-analyst` | User | `ThreadlineDemo2026!` |

These accounts are intended only for presentation and testing.

**Important:**
- Demo mode must be enabled to display simulated events in the dashboard.
- Simulated records remain marked as simulated in MongoDB.
- Built-in sample accounts and simulated records are excluded from normal dashboards.
- Never use demo accounts or demo mode in production.

---

## 🗄️ Database Structure

Threadline uses MongoDB with three main collections.

### 1. users

Stores user account and authentication information.

Typical fields include:
- User ID
- Username
- Email
- Password hash
- Role
- Account creation timestamp

### 2. login_events

Stores login activity and behavioural information.

Typical fields include:
- Event ID
- User ID
- IP address
- Device information
- Browser information
- Location
- Login timestamp
- Authentication status
- Risk score
- Risk level
- Detection reasons
- ML anomaly score

### 3. security_alerts

Stores security-related alert information.

Typical fields include:
- Alert ID
- Associated event ID
- Alert type
- Description
- Severity
- Status
- Creation timestamp

The backend connects to MongoDB during startup and creates the required indexes.

No sample users or synthetic login activity are seeded by default.

---

## 🔌 API Overview

The Express backend provides API routes for authentication, login events, dashboard analytics, risk analysis, users and security alerts.

| API Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/dashboard/stats` | GET | Dashboard statistics |
| `/api/alerts` | GET | Retrieve security alerts |
| `/api/logins` | GET | Retrieve login activity |
| `/api/risk-analysis` | GET | Retrieve risk analytics |
| `/api/users` | GET | Retrieve user information |

*The table provides an overview of the main routes. Check the backend route definitions for the exact supported methods, parameters and access permissions.*

---

## 🧪 Validation and Build

To verify the project, run the following commands from the root directory.

### TypeScript Validation

```bash
npm run typecheck
```

Checks TypeScript types across the workspaces.

### Code Linting

```bash
npm run lint
```

Checks the code for linting issues.

### Production Build

```bash
npm run build
```

Creates production builds for the application workspaces.

---

## 🔮 Future Enhancements

We aim to improve Threadline with the following features:

- Real-time login-event ingestion and risk analysis.
- Automatic security alert generation.
- Multi-factor authentication.
- IP reputation and threat intelligence integration.
- Advanced behavioural profiling.
- Improved ML model evaluation and anomaly detection.
- Automated notifications for high-risk activities.
- Enhanced security reporting and analytics.

---

## 🔐 Security Considerations

- Never commit `.env` files or database credentials to GitHub.
- Use a strong and unique JWT secret.
- Store passwords using secure password hashing.
- Use HTTP-only cookies for session tokens.
- Configure MongoDB Atlas network access carefully.
- Restrict access to administrative features.
- Do not use presentation demo credentials in production.
- Validate and sanitise incoming API requests.

`GEMINI_API_KEY` is reserved for a future integration and is not required for the current application.

---

## 👥 Contributors

**Threadline – Project Team**

Developed as a collaborative cybersecurity project.

| Team Member | Responsibility |
|---|---|
| Team Member 1 | Frontend Development |
| Team Member 2 | Backend Development |
| Team Member 3 | Machine Learning and Risk Detection |
| Team Member 4 | Database and Dashboard Integration |

*Replace the placeholders with the actual team member names and responsibilities.*

---

## ⭐ Project Vision

**"Beyond passwords. Towards behaviour-aware security."**

Threadline aims to make digital authentication smarter by understanding user behaviour, identifying unusual patterns and providing actionable security insights.

---

**If you find this project interesting, consider giving the repository a ⭐ on GitHub!**
