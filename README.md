# SaaSPOS UMKM - Multi-Tenant Cashier & Inventory Platform

[![CI Quality Gate](https://github.com/amirrdn/pos-umkm/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/amirrdn/pos-umkm/actions/workflows/ci.yml)

[![SaaS POS](https://img.shields.io/badge/SaaS-POS_UMKM-6366f1?style=for-the-badge&logo=react)](https://github.com/amirrdn/pos-umkm)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

SaaSPOS UMKM is a modern multi-tenant Point of Sale (POS) platform designed to facilitate the operational needs of small and medium-sized retail businesses. Featuring a secure and modular architecture, the system isolates each store's data using tenant-based *Row-Level Isolation*.

---

## 🚀 Key Features

This system is equipped with production-grade features:

1. **Multi-Tenancy & Data Isolation**: Secure data isolation between tenants/stores using dynamic middleware (`x-tenant-id`) for operational safety.
2. **Multi-Outlet System (Multi-Store/Branch)**: Support for isolated multi-branch locations. Product stock, transaction history, stock cards/ledger, cashier shifts, and staff are dynamically isolated based on the cashier's or employee's active outlet. Owners and Managers have access to a global dashboard to monitor all outlets.
3. **Role-Based Access Control (RBAC)**: Strict permission boundaries separating **Owners** (full access to financial reports, inventory, outlets, staff) and **Cashiers** (basic transaction & history access).
4. **Point of Sale (POS) & ACID Checkout**: Real-time stock reduction handled via Prisma Interactive Transactions to guarantee sales data integrity.
5. **Dynamic E-Wallet & QRIS (Midtrans)**: Integrated with Midtrans Sandbox for automatic dynamic QRIS generation, real-time payment polling, payment status resolution, and auto-rollback/restock if transaction expires or is cancelled.
6. **QRIS Customer Display & Second Screen**: Fullscreen QRIS display for customers, supporting second-screen setups (`/customer-display`) on external monitors.
7. **Cash Drawer & Shift Management**: Cashiers must record starting cash before making transactions and reconcile physical cash (actual cash) at shift closure, featuring automated discrepancy detection.
8. **Sales Reports by Cashier & Shift**: Real-time charts, tables, and sales summaries segregated by cashier and active shift.
9. **COGS (Cost of Goods Sold) & Net Profit Calculation**: Automatic snapshot of buy prices (COGS) at checkout to provide accurate Net Profit reports alongside gross Revenue.
10. **Stock Ledger & Mutations**: Detailed history of stock movements (SALE, RESTOCK, ADJUSTMENT, RETURN) to track the supply chain.
11. **Global Discounts & Tax (VAT)**: Support for flat and percentage-based promotions, as well as automatic tax calculation (11% VAT).
12. **Thermal Receipt Printing & WhatsApp Integration**: Print-ready 58mm thermal receipt layouts and automatic digital receipt delivery via WhatsApp.
13. **Analytical & Profit/Loss Dashboard**: Visualizations of 30-day Revenue vs Net Profit trends using Recharts AreaChart, along with top 5 best-selling products.
14. **SaaS Subscription Flow & Billing**: Tiered service plans (**FREE**, **GROWTH**, and **ENTERPRISE**) with strict backend usage limits (number of products, outlets, staff, and monthly transactions). Integrated with **Midtrans Snap & Webhooks** for billing, supporting *graceful downgrades* (safely disabling extra outlets and freezing excess staff without deleting any data).

---

## 🛠️ Tech Stack

### Frontend
- **Framework & Build Tools**: React 19, Vite, TypeScript
- **State Management**: Zustand (with persistence for auth sessions)
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts (Line/Area/Bar charts)
- **Icons**: Lucide React
- **Printing**: React-to-Print

### Backend
- **Runtime & Web Framework**: Node.js, Express, TypeScript
- **Database ORM**: Prisma ORM
- **Database Engine**: PostgreSQL
- **Schema Validation**: Zod (type-safe validation)
- **Security**: Bcrypt (password hashing), JSON Web Token / JWT (session authentication)
- **Media Uploads**: Cloudinary (product image uploads via `uploadMiddleware`)

---

## 📁 Monorepo Structure

```text
SaaSPOS/
├── backend/                  # REST API Service (Node.js/Express)
│   ├── prisma/               # Database Schema, Seeders, and Migrations
│   └── src/
│       ├── controllers/      # Controller Layer (Request/Response)
│       ├── domain/           # Isolated domain logic (auth, inventory, outlet, etc.)
│       ├── middlewares/      # Auth, Tenant, Role, and Subscription Middlewares
│       ├── routes/           # API Endpoints
│       ├── schemas/          # Zod Validation Schemas
│       └── services/         # Business Logic Layer (Prisma transactions)
├── frontend/                 # Client SPA Application (React/Vite)
│   ├── src/
│   │   ├── api/              # Axios apiClient & API modules
│   │   ├── components/       # UI Components (POS, Dashboard, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── store/            # Zustand Stores (Cart, Auth, Shift, Outlet)
│   │   └── config.ts         # Client Endpoint Configuration
│   └── README.md
```

---

## ⚙️ Local Development Guide

### Prerequisites
- Node.js version 18 or higher
- Docker (Optional, for PostgreSQL containerization)

### 1. Clone the Repository
```bash
git clone git@github.com:amirrdn/pos-umkm.git
cd pos-umkm
```

### 2. Database Setup (PostgreSQL)
If you prefer running PostgreSQL via Docker, spin up the database service defined in the backend folder:
```bash
cd backend
docker-compose up -d
```

### 3. Backend Configuration
Create a `.env` file inside the `backend/` directory:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:pos_secure_pwd_2026@localhost:5432/saas_pos?schema=public"
JWT_SECRET="very_secure_jwt_secret_2026"
CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
APP_PUBLIC_URL="http://localhost:5173"
```

> **Important:** `JWT_SECRET` must be set — the server will fail to start if this variable is missing. Refer to `backend/.env.example` for the full list of variables (Midtrans, email services, Cloudinary, etc.).

Install dependencies, run database migrations, seed initial data, and start the development server:
```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```
The backend server will run on: `http://localhost:3000`

### 4. Frontend Configuration
Navigate to the `frontend/` directory, install dependencies, and run the development build:
```bash
cd ../frontend
npm install
npm run dev
```
The frontend application will run on: `http://localhost:5173`

---

## 🔐 Default Demo Accounts (From Seeder)
Use the following credentials after seeding the database:

| Email | Password | Role |
|---|---|---|
| **owner@tokoutama.com** | `password123` | Owner (Full access to the platform & all outlets) |
| **kasir@tokoutama.com** | `password123` | Cashier (Accesses POS for the main outlet / Toko Utama Pusat) |

---

## 📝 License
This project is licensed under the [MIT](LICENSE) License.
