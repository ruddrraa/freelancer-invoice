# Freelancer Invoice Platform

Production-grade, scalable invoice management SaaS for freelancers handling both India and international clients.

## Tech Stack

- Frontend: Next.js (React), Tailwind CSS, ShadCN-style reusable UI components
- Backend: Next.js API Routes (Node.js runtime)
- Database: MongoDB Atlas + Mongoose
- Auth: JWT cookie-based auth + optional Google OAuth token endpoint
- File Storage: Cloudinary signed upload support
- Email: Resend (preferred) or SMTP/Nodemailer fallback
- Payments:
	- India: UPI QR data + bank transfer details
	- International: Stripe + PayPal + Wise payment links

## Features Implemented

- User system: signup/login/logout/me + profile settings
- Profile fields: name, logo URL, phone, address, UPI, bank details, PayPal, Wise, Stripe link
- Client management (CRUD)
- Invoice builder with live preview and dynamic line items
- Auto-generated but editable invoice numbers
- Client type based payment details (domestic vs international)
- Payment tracking statuses (pending/paid/overdue)
- Manual mark as paid and webhook handlers for Stripe/PayPal
- PDF generation endpoint for invoices
- Email invoice endpoint with PDF attachment
- Dashboard with stats, monthly revenue chart, and activity timeline
- Invoice history list with pagination, filters, search, duplicate action
- Security and reliability:
	- Input validation (Zod)
	- Route protection (proxy)
	- Rate limiting on auth endpoints
	- Encrypted sensitive payment fields
	- Indexed Mongo collections

## Folder Structure

```txt
src/
	app/
		(auth)/
			login/page.tsx
			signup/page.tsx
		(dashboard)/
			dashboard/page.tsx
			invoices/page.tsx
			invoices/new/page.tsx
			settings/page.tsx
			layout.tsx
		api/
			auth/{signup,login,google,me,logout}/route.ts
			profile/route.ts
			clients/route.ts
			clients/[id]/route.ts
			invoices/route.ts
			invoices/[id]/route.ts
			invoices/[id]/duplicate/route.ts
			invoices/[id]/mark-paid/route.ts
			invoices/[id]/pdf/route.ts
			invoices/[id]/send/route.ts
			dashboard/summary/route.ts
			payments/webhooks/stripe/route.ts
			payments/webhooks/paypal/route.ts
			uploads/cloudinary-sign/route.ts
		globals.css
		layout.tsx
		page.tsx
	components/
		dashboard/revenue-chart.tsx
		invoice/invoice-preview.tsx
		layout/app-shell.tsx
		layout/theme-toggle.tsx
		ui/{badge,button,card,input,select,textarea}.tsx
		theme-provider.tsx
	lib/
		activity.ts
		api.ts
		auth.ts
		cloudinary.ts
		crypto.ts
		db.ts
		env.ts
		fetcher.ts
		invoice.ts
		mail.ts
		payments.ts
		pdf.ts
		rate-limit.ts
		utils.ts
		validation.ts
	models/
		ActivityLog.ts
		Client.ts
		Invoice.ts
		Payment.ts
		User.ts
	proxy.ts
```

## Data Models

- Users
- Clients
- Invoices
- Payments
- Activity Logs

All key query paths use indexes (status, userId, invoiceNumber, date-based lookups).

## API Overview

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET/PUT /api/profile`
- `GET/POST /api/clients`
- `GET/PUT/DELETE /api/clients/:id`
- `GET/POST /api/invoices`
- `GET/PUT/DELETE /api/invoices/:id`
- `POST /api/invoices/:id/duplicate`
- `POST /api/invoices/:id/mark-paid`
- `GET /api/invoices/:id/pdf`
- `POST /api/invoices/:id/send`
- `GET /api/dashboard/summary`
- `POST /api/payments/webhooks/stripe`
- `POST /api/payments/webhooks/paypal`
- `POST /api/uploads/cloudinary-sign`

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Configure environment

- Copy `.env.example` into `.env.local`
- Fill MongoDB, JWT, and provider keys

3. Run locally

```bash
npm run dev
```

4. Build for production

```bash
npm run build
npm start
```

## Notes

- For Stripe webhooks, include `invoiceId` and `userId` in checkout session metadata.
- For PayPal webhook mapping, ensure your `custom_id` / invoice mapping aligns with your capture flow.
- You can upgrade to true WebSocket updates later; current UI supports polling refresh patterns.
