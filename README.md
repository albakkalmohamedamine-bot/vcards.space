# VCARDS SPACE 🚀

**VCARDS SPACE** is a high-performance, full-stack NFC digital business cards platform built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL & Auth)**.

The platform provides a dual architecture:
1. **Public Visitor Digital Cards (`/card/[slug]`)**: Lightning-fast, mobile-first landing pages loaded when a client or customer scans an NFC card, QR code, or visits a shared link. Fully accessible without login.
2. **Protected Admin Management Console (`/` & `/admin`)**: Gated behind secure Supabase Authentication, allowing the administrator to design, provision, configure, and monitor digital cards and visitor analytics.

---

## 🌟 Key Features

- **Dual Digital Card Formats**:
  - **Professional Profile Types**:
    - *Style 1*: Dynamic sloped theme header with floating avatar pill.
    - *Style 2*: Formal flat theme header with high-contrast profile styling.
    - *Style 3*: Cinematic cover photo banner with elevated profile badge.
  - **Business Link-List Type**:
    - Stacked contact & channel action buttons with interactive modals (Menu PDF, WiFi password, Delivery hotline, Google 5-Star Reviews, Location, Socials, Multi-Links).
    - Fixed background support (color gradients or custom/bespoke photographic visuals).
    - Context-aware translucent glass styling with deep contrast.
- **Unified 3-Dots Glass Header Menu**:
  - Integrated into all card designs (both Professional and Business).
  - One-tap access to **Share Card** (rendering an on-demand QR code tile, copy link button, and native share sheet) and the **Multi-Language Switcher** (English, French, Arabic with complete RTL layout mirroring).
- **Privacy-First Visitor Analytics Engine**:
  - Non-blocking telemetry tracking views, physical QR scans (`?src=qr`), shared referrals (`?src=share`), and action conversions (Calls, WhatsApp, Maps, Reviews, Menu views).
  - Dedicated Analytics tab in the admin console with time presets (*Today*, *7 Days*, *30 Days*, *All Time*) and card-by-card drilldowns.
- **Bespoke Local Visual Presets**:
  - 11 custom-crafted 9:16 portrait assets stored in `/public/images/niches/` (Restaurant, Barbershop, Cosmetics, Women's Salon, Library, Lawyer, Doctor/Clinic, Real Estate, Gym, Executive Lounge).
- **vCard (.vcf) Generator**:
  - Single-tap contact saving directly into iOS Contacts and Android Google Contacts.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with CSS Logical Properties (RTL support)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security & Supabase Auth)
- **Animations**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **QR Code Rendering**: `qrcode.react`

---

## 🚀 Quick Start Guide

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd <repo-folder>
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory based on `.env.example`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key

# Optional: Host URL for self-referential links
APP_URL=https://yourdomain.com
```

### 3. Setup Supabase Database & Security Rules

1. Open your project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab.
3. Paste the contents of `supabase_rls.sql` into the editor and click **Run**.
4. This will:
   - Create the `business_cards` table and all columns.
   - Create the `card_events` analytics table with optimized composite indexes.
   - Configure Row Level Security (RLS) policies allowing public card reads and authenticated admin writes.
   - Create the public `logos` storage bucket with allowed MIME types for avatars, cover photos, and menu PDFs.

### 4. Create Your Admin User

1. In your Supabase Dashboard, go to **Authentication** -> **Users**.
2. Click **Add User** -> **Create User**.
3. Enter your administrative email and password.
4. Use these credentials to sign in at `/login`.

### 5. Run the Local Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser:
- Visiting `/` or `/admin` will prompt you to log in at `/login`.
- Visiting `/card/[slug]` will display any card publicly without requiring authentication.

---

## 📦 Production Build & Deployment

To verify and build the production bundle:

```bash
npm run build
npm run start
```

### Deploying to Vercel or Cloud Run

1. **Vercel**: Import your GitHub repository, configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Environment Variables, and deploy.
2. **Docker / Cloud Run**: Standard Next.js standalone container deployment.

---

## 🔒 Security Architecture

- **Public Routes**: `/card/*`, `/api/track` (visitor tracking).
- **Protected Routes**: `/`, `/admin`, `/admin/analytics` (strictly guarded by `getSession()` with automatic redirection to `/login`).
- **Database Layer**: Row Level Security (RLS) guarantees that public visitors can only read published cards, while insert, update, and delete operations strictly require an authenticated Supabase user session (`auth.role() = 'authenticated'`).

---

## 📄 License

Private commercial software designed for VCARDS SPACE.
