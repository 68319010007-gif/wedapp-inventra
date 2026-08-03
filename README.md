# Inventra

**Smart Inventory & Sales Management System**

ระบบจัดการสต็อกและยอดขาย (Inventory & Sales Management) พร้อมหน้าร้านค้าออนไลน์ รองรับการอัปเดตสต็อกแบบ real-time และระบบแจ้ง/ตรวจสอบการชำระเงิน
Built with React + Express.js + PostgreSQL + Socket.IO + Docker

## Tech Stack

| ส่วน (Layer) | เทคโนโลยี |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express.js, Prisma ORM |
| Real-time | Socket.IO (WebSocket) |
| API | REST API (JSON) |
| Database | PostgreSQL |
| DevOps | Docker, Docker Compose |

## Modules (ระบบย่อยทั้งหมด)

| Module | รายละเอียด |
|--------|-------------|
| Auth | ระบบ login, JWT token, สิทธิ์การเข้าถึงตาม role (แยก token ฝั่งพนักงาน/ลูกค้า) |
| Users | จัดการพนักงาน |
| Customers | จัดการลูกค้า |
| Products | สินค้า, barcode, รูปภาพหลายรูปต่อสินค้า, แจ้งเตือนสต็อกใกล้หมด |
| Categories | หมวดหมู่สินค้า |
| Inventory | สต็อก — รับเข้า / เบิกออก / ปรับยอด, อัปเดต real-time ผ่าน WebSocket |
| Purchases | สั่งซื้อจาก supplier แล้วรับเข้าสต็อก |
| Sales | คำสั่งขาย (Sales Orders) |
| Store (หน้าร้านค้าออนไลน์) | ลูกค้าเลือกซื้อสินค้า, ตะกร้า, checkout |
| Order History | ลูกค้าดูประวัติคำสั่งซื้อ, ติดตามสถานะ, ยกเลิกคำสั่งซื้อได้เอง (คืนสต็อกอัตโนมัติ) |
| Payments | ลูกค้าแจ้งชำระเงิน + อัปโหลดสลิป, แอดมินตรวจสอบ/อนุมัติ/ปฏิเสธ |
| Suppliers | ผู้จำหน่าย/ซัพพลายเออร์ |
| Reports | Dashboard KPI, รายงานยอดขาย/สต็อก |
| Settings | ตั้งค่าระบบ, ธีม |
| Upload | อัปโหลดรูปสินค้า/รูปโปรไฟล์/สลิปโอนเงิน |
| Audit Log | บันทึกกิจกรรมการใช้งานระบบ (รวมการยกเลิกออเดอร์/ตรวจสอบการชำระเงิน) |

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
| ประวัติคำสั่งซื้อ (ลูกค้า) | http://localhost:5173/orders |
| Admin Login | http://localhost:5173/admin/login |
| Admin Dashboard | http://localhost:5173/admin |
| Admin: Payments | http://localhost:5173/admin/payments |

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

**หมายเหตุ:** ทุกครั้งที่แก้ `backend/prisma/schema.prisma` ต้องรัน `npx prisma generate` ใหม่เสมอ (ไม่รวมอยู่ใน hot-reload อัตโนมัติ)

## API Overview

Base URL: `/api/v1`

```
POST   /auth/login
GET    /auth/me
PUT    /auth/profile
PUT    /auth/password

GET    /dashboard/summary

GET    /products
POST   /products
PUT    /products/:id
DELETE /products/:id
POST   /products/:id/images
DELETE /products/:id/images/:imageId
PATCH  /products/:id/images/:imageId/primary

GET    /categories
POST   /categories

GET    /inventory/stock
GET    /inventory/movements
POST   /inventory/movements

GET    /sales/orders
POST   /sales/orders
PATCH  /sales/orders/:id/status
DELETE /sales/orders/:id

GET    /purchases
POST   /purchases
PATCH  /purchases/:id/receive

GET    /customers
GET    /suppliers

GET    /payments
GET    /payments/:id
PATCH  /payments/:id/verify
PATCH  /payments/:id/reject

GET    /reports/sales
GET    /reports/inventory
GET    /settings
POST   /upload
GET    /audit-log

# ---- Store (ฝั่งลูกค้า) ----
POST   /store/auth/register
POST   /store/auth/login
GET    /store/auth/me
PUT    /store/auth/profile
PUT    /store/auth/password

GET    /store/categories
GET    /store/products
GET    /store/products/:id
POST   /store/checkout

GET    /store/orders
GET    /store/orders/:id
PATCH  /store/orders/:id/cancel
POST   /store/orders/:id/payment
```

## Real-time Updates

Backend เปิด WebSocket (Socket.IO) บนพอร์ตเดียวกับ REST API (4000) — ทุกครั้งที่สต็อกเปลี่ยน (รับเข้า/เบิกออก/ขาย/ยกเลิกออเดอร์) จะ broadcast event `stock:updated` ไปยังทุก client ที่เปิดหน้า Shop/Inventory ค้างอยู่ ทำให้ตัวเลขสต็อกอัปเดตทันทีโดยไม่ต้อง refresh หน้า

## Project Structure

```
inventra/
├── backend/          # Express.js REST API + Socket.IO
├── frontend/         # React dashboard + store
├── docker-compose.yml
└── .env.example
```

## License

Private — Inventra