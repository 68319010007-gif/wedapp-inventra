# Inventra

**Smart Inventory & Sales Management System**

ระบบจัดการสต็อกและยอดขาย (Inventory & Sales Management) พร้อมหน้าร้านค้าออนไลน์
Built with React + Express.js + PostgreSQL + Docker

## Tech Stack

| ส่วน (Layer) | เทคโนโลยี |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express.js, Prisma ORM |
| API | REST API (JSON) |
| Database | PostgreSQL |
| DevOps | Docker, Docker Compose |

## Modules (ระบบย่อยทั้งหมด)

| Module | รายละเอียด |
|--------|-------------|
| Auth | ระบบ login, JWT token, สิทธิ์การเข้าถึงตาม role |
| Users | จัดการพนักงาน |
| Customers | จัดการลูกค้า |
| Products | สินค้า, barcode, แจ้งเตือนสต็อกใกล้หมด |
| Categories | หมวดหมู่สินค้า |
| Inventory | สต็อก — รับเข้า / เบิกออก / ปรับยอด |
| Purchases | สั่งซื้อจาก supplier แล้วรับเข้าสต็อก |
| Sales | คำสั่งขาย (Sales Orders) |
| Suppliers | ผู้จำหน่าย/ซัพพลายเออร์ |
| Reports | Dashboard KPI, รายงานยอดขาย/สต็อก |
| Settings | ตั้งค่าระบบ, ธีม |
| Upload | อัปโหลดรูปสินค้า |
| Audit Log | บันทึกกิจกรรมการใช้งานระบบ |

## Quick Start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

## URLs

| หน้า | URL |
|------|-----|
| Store Home | http://localhost:5173/ |
| Shop | http://localhost:5173/shop |
| Cart / Checkout | http://localhost:5173/cart |
| Admin Login | http://localhost:5173/admin/login |
| Admin Dashboard | http://localhost:5173/admin |

Default admin (หลัง seed): `admin@inventra.com` / `Admin@1234`

## Local Development (ไม่ใช้ Docker)

### Backend

```bash
cd backend
npm install
cp ../.env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Overview

Base URL: `/api/v1`