# Inventra

**Smart Inventory & Sales Management System**

ระบบจัดการสต็อกและยอดขาย (Inventory & Sales Management) พร้อมหน้าร้านค้าออนไลน์ รองรับการอัปเดตสต็อกแบบ real-time และระบบแจ้ง/ตรวจสอบการชำระเงิน
Built with React + Express.js + PostgreSQL + Socket.IO + Docker

## Tech Stack

| ส่วน (Layer) | เทคโนโลยี                               |
| ------------ | --------------------------------------- |
| Frontend     | React, Vite, Tailwind CSS, React Router |
| Backend      | Node.js, Express.js, Prisma ORM         |
| Real-time    | Socket.IO (WebSocket)                   |
| API          | REST API (JSON)                         |
| Database     | PostgreSQL                              |
| DevOps       | Docker, Docker Compose, GitHub Actions (CI/CD) |

## Modules (ระบบย่อยทั้งหมด)

| Module                     | รายละเอียด                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------- |
| Auth                       | ระบบ login, JWT token, สิทธิ์การเข้าถึงตาม role (แยก token ฝั่งพนักงาน/ลูกค้า)     |
| Users                      | จัดการพนักงาน                                                                      |
| Customers                  | จัดการลูกค้า                                                                       |
| Products                   | สินค้า, barcode, รูปภาพหลายรูปต่อสินค้า, แจ้งเตือนสต็อกใกล้หมด                     |
| Categories                 | หมวดหมู่สินค้า                                                                     |
| Inventory                  | สต็อก — รับเข้า / เบิกออก / ปรับยอด, อัปเดต real-time ผ่าน WebSocket               |
| Purchases                  | สั่งซื้อจาก supplier แล้วรับเข้าสต็อก                                              |
| Sales                      | คำสั่งขาย (Sales Orders)                                                           |
| Store (หน้าร้านค้าออนไลน์) | ลูกค้าเลือกซื้อสินค้า, ตะกร้า, checkout                                            |
| Order History              | ลูกค้าดูประวัติคำสั่งซื้อ, ติดตามสถานะ, ยกเลิกคำสั่งซื้อได้เอง (คืนสต็อกอัตโนมัติ) |
| Payments                   | ลูกค้าแจ้งชำระเงิน + อัปโหลดสลิป, แอดมินตรวจสอบ/อนุมัติ/ปฏิเสธ                     |
| Suppliers                  | ผู้จำหน่าย/ซัพพลายเออร์                                                            |
| Reports                    | Dashboard KPI, รายงานยอดขาย/สต็อก                                                  |
| Settings                   | ตั้งค่าระบบ, ธีม                                                                   |
| Upload                     | อัปโหลดรูปสินค้า/รูปโปรไฟล์/สลิปโอนเงิน                                            |
| Audit Log                  | บันทึกกิจกรรมการใช้งานระบบ (รวมการยกเลิกออเดอร์/ตรวจสอบการชำระเงิน)                |

## Quick Start (Docker — Local Dev)

```
cp .env.example .env
docker compose up --build
```

## URLs (Local Dev)

| หน้า                       | URL                                    |
| -------------------------- | -------------------------------------- |
| Store Home                 | <http://localhost:5173/>               |
| Shop                       | <http://localhost:5173/shop>           |
| Cart / Checkout            | <http://localhost:5173/cart>           |
| ประวัติคำสั่งซื้อ (ลูกค้า) | <http://localhost:5173/orders>         |
| Admin Login                | <http://localhost:5173/admin/login>    |
| Admin Dashboard            | <http://localhost:5173/admin>          |
| Admin: Payments            | <http://localhost:5173/admin/payments> |

> **Default admin (หลัง seed):** ดูรายละเอียดใน `backend/prisma/seed.js`
> ⚠️ **ต้องเปลี่ยนรหัสผ่านทันทีหลัง deploy ขึ้น production** ผ่านหน้า `/admin/profile` — ห้ามใช้ค่า default ต่อในเครื่องที่เข้าถึงได้จากอินเทอร์เน็ต เพราะ repo นี้เป็น public ใครก็เปิดดู seed script ได้

## Production Deployment (CI/CD)

โปรเจกต์นี้ deploy อัตโนมัติผ่าน **GitHub Actions** ทุกครั้งที่ push เข้า branch `main`:

```
push to main
   → build backend image  (backend/Dockerfile.prod)
   → build frontend image (frontend/Dockerfile.prod, multi-stage + nginx)
   → push ทั้ง 2 image ขึ้น Docker Hub
   → SSH เข้า server (key-based auth เท่านั้น) แล้วรัน docker compose ด้วย docker-compose.deploy.yml
```

**สถาปัตยกรรมบน server:** มีเพียง service `frontend` (nginx) ที่เปิด port สาธารณะ 1 พอร์ต — nginx ทำหน้าที่ serve React build และ reverse proxy คำขอ `/api/`, `/uploads/`, `/socket.io/` เข้าไปยัง service `backend` ผ่าน internal Docker network เท่านั้น service `backend` และ `db` **ไม่เปิด port ออกอินเทอร์เน็ตโดยตรง**

Live URL: `http://202.29.231.188:30007/`

### ไฟล์ที่เกี่ยวข้องกับ production deploy (แยกจาก dev)

```
.
├── docker-compose.yml           # ใช้สำหรับ local dev เท่านั้น
├── docker-compose.deploy.yml    # ใช้บน server จริง (ไม่มี volume mount source, ไม่เปิด port db/backend)
├── backend/
│   ├── Dockerfile               # dev (nodemon, hot-reload)
│   └── Dockerfile.prod          # production (npm start, ไม่ auto-seed)
├── frontend/
│   ├── Dockerfile               # dev (vite dev server)
│   ├── Dockerfile.prod          # production (vite build + nginx, multi-stage)
│   └── nginx.conf               # reverse proxy config บน production
└── .github/workflows/deploy.yml # CI/CD pipeline
```

### GitHub Secrets ที่ต้องตั้ง (repo settings → Secrets and variables → Actions)

| Secret | ใช้ทำอะไร |
|---|---|
| `SSH_HOST`, `SSH_PORT`, `SSH_USER` | ข้อมูลเชื่อมต่อ server |
| `SSH_PRIVATE_KEY` | private key **เฉพาะของผู้ deploy คนนั้น** (ไม่ใช้ password ร่วม) |
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | สำหรับ push image ขึ้น Docker Hub |
| `POSTGRES_PASSWORD`, `JWT_SECRET` | ค่าสุ่มเฉพาะของ production เท่านั้น ห้ามใช้ค่าใน `.env.example` |

## Local Development (ไม่ใช้ Docker)

### Backend

```
cd backend
npm install
cp ../.env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend

```
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
POST   /store/auth/upload

GET    /store/addresses
POST   /store/addresses
GET    /store/addresses/:id
PUT    /store/addresses/:id
DELETE /store/addresses/:id

GET    /store/categories
GET    /store/products
GET    /store/products/:id
POST   /store/checkout

GET    /store/orders
GET    /store/orders/:id
PATCH  /store/orders/:id/cancel
POST   /store/orders/:id/payment
```

## Customer Account (หน้าร้าน)

| หน้า | URL |
| --- | --- |
| ภาพรวมบัญชี | `/account` |
| แก้ไขข้อมูลส่วนตัว | `/account/profile` |
| จัดการที่อยู่ | `/account/addresses` |
| คำสั่งซื้อ | `/account/orders` |

## Real-time Updates

Backend เปิด WebSocket (Socket.IO) บนพอร์ตเดียวกับ REST API (4000) — ทุกครั้งที่สต็อกเปลี่ยน (รับเข้า/เบิกออก/ขาย/ยกเลิกออเดอร์) จะ broadcast event `stock:updated` ไปยังทุก client ที่เปิดหน้า Shop/Inventory ค้างอยู่ ทำให้ตัวเลขสต็อกอัปเดตทันทีโดยไม่ต้อง refresh หน้า

## Project Structure

```
inventra/
├── backend/          # Express.js REST API + Socket.IO
├── frontend/         # React dashboard + store
├── docker-compose.yml        # local dev
├── docker-compose.deploy.yml # production
├── .github/workflows/deploy.yml
└── .env.example
```

## License

Private — Inventra