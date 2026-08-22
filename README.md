# 💰 DhanSaarthi — AI Personal Wealth Companion

> **Empowering individuals with intelligent bank statement analytics, financial health scoring, goal forecasting, and context-aware conversational AI.**

[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-blue?logo=react)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Backend-Flask%20%7C%20Python-emerald?logo=flask)](https://flask.palletsprojects.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20%7C%20SQLAlchemy-orange?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-MIT-purple)](#)

---

## 🌟 Overview

**DhanSaarthi** is a full-stack personal finance and wealth management platform tailored to modern earners. It transforms complex raw bank statements and transactional data into actionable financial intelligence, automated budgeting benchmarks, risk assessments, and real-time AI advisory.

---

## ✨ Key Features

* **📊 Unified Multi-Timeframe Dashboard**:
  * Toggle between **Lifetime (All-Time)**, **Yearly**, and **Monthly** reports with instant filtering.
  * Plain-English executive summaries explaining monthly cash flow and savings health.
  * Real-time cashflow trajectory trends and interactive category spending breakdowns.

* **🤖 Saarthi AI Copilot**:
  * Conversational personal wealth assistant with live financial context.
  * Understands date queries (*"how much did I spend yesterday?"*), category queries (*"show my food spending"*), and budgeting optimization tips.

* **🛡️ Financial Confidence Score (0–100)**:
  * Transparent multidimensional rating evaluating:
    1. **Savings Rate** (Benchmark: ≥30%)
    2. **Discretionary Spending Control** (Needs vs. Wants)
    3. **Emergency Fund Buffer** (3–6 months coverage)
    4. **Goal Completion Trajectory**

* **🎯 Financial Goal Simulator & Gap Analysis**:
  * Set targets for Emergency Funds, Vacations, Home Down Payments, or Vehicles.
  * Computes required monthly savings, projected shortfalls, and recommended budget adjustments.

* **📥 Automated Statement Ingestion & Categorization**:
  * Smart parsing for CSV bank statements with auto-categorization (Food, Rent, Utilities, Investments, Shopping, etc.).
  * Mock Account Aggregator simulation to link mock bank accounts via OTP.

* **⚖️ Investor Risk Profiling**:
  * Interactive risk tolerance quiz recommending diversified portfolio allocations across Equities, Debt/Bonds, and Liquid Cash.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Recharts, Lucide Icons, Vanilla CSS Design System |
| **Backend** | Python 3.12, Flask, Flask-SQLAlchemy, Flask-CORS, Python-Dotenv |
| **Database** | SQLite (with seamless fallback mock state) |
| **AI / NLP** | Context-aware NLP Rule Engine + LLM API integration support |

---

## 🚀 Quick Start & Local Setup

### 1. Prerequisites
* **Python 3.10+**
* **Node.js 18+** & `npm`

---

### 2. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Create & activate virtual environment (Windows PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
python -m pip install -r requirements.txt

# Start the Flask API server
python app.py
```
> The backend will start on **`http://127.0.0.1:5000`**.

---

### 3. Frontend Setup

In a new terminal window:

```powershell
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
> The frontend will be available at **`http://localhost:5173`**.

---

## 📁 Project Structure

```text
dhansaarthi/
├── backend/
│   ├── app.py                      # Flask app factory & routing
│   ├── config.py                   # Configuration & environment loader
│   ├── models/                     # SQLAlchemy data models (User, Transaction, Goal, Profile)
│   ├── routes/                     # Blueprint routes (Dashboard, Goals, Score, Chat, Upload, Auth)
│   ├── services/                   # Business logic (AI engine, Scorer, Parser, Goal gap analysis)
│   └── data/                       # Sample CSV bank statements
├── frontend/
│   ├── src/
│   │   ├── api/client.js           # API service with failover resilience
│   │   ├── components/             # Reusable UI components (Charts, Navbar, ChatWidget)
│   │   ├── pages/                  # Views (Dashboard, Goals, ConfidenceScore, ChatAssistant, Upload, Auth)
│   │   ├── App.jsx                 # Main application layout & state
│   │   └── index.css               # Design system tokens & typography
│   └── package.json
└── README.md
```

---

## 🔒 Security & Privacy

* **Local Ingestion**: Statement parsing and financial analysis are processed locally with token authentication.
* **Non-Custodial Data Flow**: PII and sensitive banking data remain encrypted and sanitized.

---

## 👥 Contributors

* **DhanSaarthi Team** — *Built for Hackathon 2026*
