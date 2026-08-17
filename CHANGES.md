# Fixes applied

Your project scope (section 5.5) requires a payment-notification + admin-verification
workflow. The frontend and README already assumed this existed, but the backend never
implemented it — that was the main "error" causing the app to be broken/incomplete.

## What was broken
- `frontend/src/pages/store/OrdersPage.jsx` calls `POST /store/orders/:id/payment` and
  reads `order.payment` / `order.payment.status`, but that route didn't exist
  (`backend/src/routes/store.routes.js`) → always 404s in the browser console.
- README documented `GET /payments`, `PATCH /payments/:id/verify`,
  `PATCH /payments/:id/reject`, but there was no `payments.routes.js` and nothing
  registered in `app.js`.
- No `Payment` model in `prisma/schema.prisma` at all.
- `OrdersPage.jsx` used i18n keys that didn't exist in `en.js`/`th.js`
  (`store.payment`, `store.notifyPayment`, `store.uploadSlipHint`,
  `store.submitPayment`, `store.paymentPending/Verified/Rejected`,
  `store.paymentRejectedReason`) → these rendered as raw keys in the UI.
- No admin "Payments" page, no `/admin/payments` route, no sidebar link — so even once
  the backend exists, staff had no way to verify slips.
- `CheckoutPage.jsx` posts a `customer: {name, phone, address}` shipping block that the
  backend silently discarded (checkout only used the logged-in profile) — the shipping
  info the customer typed was lost.

## What changed (files included in this patch, same paths as the repo)
- `backend/prisma/schema.prisma` — added `Payment` model + `PaymentStatus` enum,
  relation from `SalesOrder.payment` and `User.verifiedPayments`.
- `backend/prisma/migrations/20260812000000_add_payments/migration.sql` — matching SQL
  migration (Docker's `prisma migrate deploy` will pick this up automatically on next
  `docker compose up --build`).
- `backend/src/routes/payments.routes.js` — new: `GET /payments`, `GET /payments/:id`,
  `PATCH /payments/:id/verify`, `PATCH /payments/:id/reject`.
- `backend/src/app.js` — registers the new payments router at `/api/v1/payments`.
- `backend/src/routes/store.routes.js` — adds `POST /store/orders/:id/payment` (slip
  upload via multer, upserts a `Payment` row), includes `payment` on order queries so
  `OrdersPage.jsx` gets real data, and fixes the checkout shipping-info data loss.
- `frontend/src/pages/PaymentsPage.jsx` — new admin page: list payments by status,
  view slip image, verify/reject with a reason.
- `frontend/src/App.jsx` — adds the `/admin/payments` route.
- `frontend/src/components/Sidebar.jsx` — adds the "Payments" nav link.
- `frontend/src/i18n/en.js`, `frontend/src/i18n/th.js` — adds all the missing
  `store.payment*` keys plus an `admin.payments` section, in both languages.

## How to apply
1. Copy these files into your repo at the same paths (overwriting the originals).
2. `docker compose up --build` — the backend Dockerfile already runs
   `npx prisma migrate deploy` on start, so the new `Payment` table will be created
   automatically. If you run locally without Docker, run
   `npx prisma migrate dev` inside `backend/`.
3. Rebuild frontend (Vite will hot-reload if the dev containers are already running).

## Known remaining gap (not fixed, flagging for you)
- Checkout still moves an order straight to `PROCESSING` and deducts stock immediately,
  rather than holding it `PENDING` until a payment is verified. Section 5.5 of your
  proposal implies stock/status should react to payment verification. Wiring that up
  is a bigger behavioral change (affects cancellation logic, stock timing, etc.), so I
  left the existing checkout behavior in place and only fixed the parts that were
  actually broken/missing. Happy to implement the stricter flow if you want it.
