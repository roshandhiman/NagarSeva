<p align="center">
  <img src="https://img.shields.io/badge/NagarSeva-Civic%20Platform-00f2fe?style=for-the-badge&labelColor=0a0a0f" alt="NagarSeva" />
</p>

<h1 align="center">🏛️ NagarSeva</h1>

<p align="center">
  <strong>नगरसेवा — Empowering Citizens. Transforming Cities.</strong>
</p>

<p align="center">
  <a href="#-features"><img src="https://img.shields.io/badge/Features-✨-34d399?style=flat-square" /></a>
  <a href="#-tech-stack"><img src="https://img.shields.io/badge/Stack-🛠️-a78bfa?style=flat-square" /></a>
  <a href="#-getting-started"><img src="https://img.shields.io/badge/Setup-⚡-f59e0b?style=flat-square" /></a>
  <a href="#-architecture"><img src="https://img.shields.io/badge/Architecture-🧩-00f2fe?style=flat-square" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD627" alt="Vite" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
</p>

---

> **NagarSeva** (नगरसेवा — *"Service to the City"*) is a full-stack civic engagement platform that bridges the gap between citizens and municipal authorities. Citizens can geo-tag and report infrastructure problems like potholes, garbage pile-ups, and water leakages — while administrators track, review, and resolve issues in real-time through a dedicated command center.

---

## ✨ Features

### 🤖 NagBot AI Assistant (Groq-Powered)
- **Strict Personal Report Tracker**: A secure AI chatbot strictly scoped to the logged-in user's own reports.
- **Natural Language Interaction**: Users can ask NagBot about their active, resolved, or under-review reports in plain English.
- **Quick Action Buttons**: Includes one-tap shortcuts (`📋 My Reports`, `✅ Resolved`, `📋 Open`) for instant progress tracking.
- **Secure & Focused**: Politely refuses off-topic queries (coding, general knowledge, or other users' reports) to keep users focused on civic resolutions.
- **Ultra-Fast Performance**: Driven by the lightning-fast **Groq Cloud API** running `llama-3.1-8b-instant`.

### 🔁 Real-Time Duplicate Report Detection
- **Smart Geo-Analysis**: Automatically analyzes reports within a 2km radius when a citizen drafts a new report.
- **AI Matching Engine**: Groq checks the new report's description, title, and category against nearby records.
- **Interactive Warn Banner**: Displays a floating alert banner on the report form if a duplicate is found, allowing citizens to check the existing report instead of creating clutter.

### 🗺️ Interactive GPS-Powered Map
- Auto-locates the user on load and centers the Leaflet map on their GPS coordinates.
- Citizens can click anywhere to drop a pin and instantly file a new report.
- Map heatmap shows areas with high report density — clicking a cluster navigates to that zone.
- **Admin dashboard** map is clickable — redirects to areas with the most active reports.

### 📝 Instant Report Submission
- One-tap modal to report **Pothole**, **Garbage**, **Water Leakage**, or **General Hazard**.
- Photo upload with live preview — images stored in Supabase Storage buckets.
- Auto-attaches GPS coordinates and timestamp to every submission.

### 🔑 Flexible Authentication
- **Google OAuth** single-click sign-in.
- Traditional **Email / Username + Password** login & signup.
- Session persistence via `localStorage` with automatic role detection.

### 🛡️ Municipal Command Center (Admin Portal)
- Dedicated admin dashboard to review all citizen-submitted reports.
- Status workflow: **Reported** → **Under Review** → **Resolved** with one-click transitions.
- Admin can add resolution comments and attach **fix verification photos** to resolved issues.
- Admin credentials: `admin` / `admin` (for local development).

### 🏆 Gamified Leaderboard & Badges
| Action | Points |
|---|---|
| Submit a report | +50 pts |
| Issue resolved | +100 pts |

- Badge tiers: **First Responder** → **Street Sentinel** → **Municipal Magnet** → **City Champion**
- Live leaderboard with animated rank cards.

### 👤 Citizen Profiles
- View any user's profile by clicking their name on the public feed.
- Profile modal shows username, bio, level, points, earned badges, and their submitted reports.
- Editable profile section for authenticated users.

### 📰 Public Activity Feed
- Chronological stream of all civic reports across the platform.
- Smart deduplication — no repeated reports from the same user.
- Each card shows: title, type, description, photo, status badge, reporter name, and timestamp.

### 🎨 Premium Aesthetic
- Vibrant dark-mode interface with glassmorphic cards and glowing borders.
- Interactive particle constellation background (`<canvas>` powered).
- Custom cursor follower with magnetic hover effects.
- Micro-animations, smooth transitions, and scroll-reveal effects.
- Typography powered by **Google Fonts** (Inter + Outfit).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | HTML5, Vanilla CSS3 (Glassmorphic design system), JavaScript (ES6 Modules) |
| **Maps** | Leaflet.js with OpenStreetMap tile layers |
| **Backend & DB** | Supabase (PostgreSQL, Real-time subscriptions, Auth, Storage) |
| **Build Tool** | Vite (HMR + ESM dev server) |
| **Hosting** | Any static host (Vercel, Netlify, GitHub Pages) |

---

## 🧩 Architecture

```
NagarSeva/
├── index.html              # Landing page — hero section, features, testimonials
├── dashboard.html          # Citizen & Admin portal (SPA-style with JS routing)
├── src/
│   ├── main.js             # Landing page animations, particles, scroll effects
│   ├── dashboard.js        # Core portal logic — map, reports, auth, admin panel
│   ├── api.js              # Supabase client, CRUD operations, storage, auth helpers
│   ├── style.css           # Global design system — dark theme, glassmorphism
│   └── dashboard.css       # Portal-specific layout, sidebar, cards, modals
├── public/
│   └── favicon.svg         # App icon
├── .env                    # Supabase credentials (not committed)
├── package.json
└── vite.config.js
```

**Data Flow:**
```
Citizen App                    Supabase Backend                Admin Portal
┌─────────────┐    submit     ┌──────────────────┐    fetch    ┌─────────────┐
│  Report Form │──────────────▶│  reports table   │◀────────────│  Admin View │
│  + Photo     │              │  + storage bucket │             │  + Actions  │
└─────────────┘              └──────────────────┘             └─────────────┘
       │                            │                               │
       │        real-time           │          status update        │
       └────────◀───────────────────┘◀──────────────────────────────┘
```

---

## ⚡ Getting Started

### 📋 Prerequisites

- [Node.js](https://nodejs.org/) **v18+**
- A [Supabase](https://supabase.com/) project (free tier works perfectly)

### 🚀 Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/roshandhiman/NagarSeva.git
cd NagarSeva

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Launch development server
npm run dev
```

### 🔐 Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key_here
```

---

## 🗄️ Database Setup

Execute the following SQL in the **Supabase SQL Editor** to create the required schema:

```sql
-- ══════════════════════════════════════════════
-- 1. USERS TABLE
-- ══════════════════════════════════════════════
CREATE TABLE public.users (
  user_id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT,
  points INTEGER DEFAULT 50,
  badges TEXT[] DEFAULT '{First Responder}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ══════════════════════════════════════════════
-- 2. REPORTS TABLE
-- ══════════════════════════════════════════════
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'reported',
  timestamp BIGINT,
  user_id UUID REFERENCES public.users(user_id),
  username TEXT NOT NULL
);

-- ══════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on users"
  ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on users"
  ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on users"
  ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on reports"
  ON public.reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on reports"
  ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on reports"
  ON public.reports FOR UPDATE USING (true);

-- ══════════════════════════════════════════════
-- 4. STORAGE BUCKET
-- ══════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public)
  VALUES ('community_hero_bucket', 'community_hero_bucket', true);

CREATE POLICY "Allow public read on bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'community_hero_bucket');

CREATE POLICY "Allow public upload on bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'community_hero_bucket');
```

---

## 🔑 Default Credentials

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin` | `admin` |
| **Citizen** | Sign up via the portal | — |

> **Note:** Admin credentials are for local development only. In production, configure proper role-based access through Supabase Auth.

---

## 🖼️ Interface Preview

### 🌐 Landing Page
> Particle constellation background, animated typography, scroll-reveal sections, and a live mockup feed showcasing the platform's capabilities.

### 📊 Citizen Dashboard
> Interactive GPS map with incident markers, report submission modal with photo upload, live activity feed, gamified leaderboard, and profile management.

### 🛡️ Admin Command Center
> Comprehensive ticket management grid with status transitions, resolution comments, fix photo attachments, and real-time report monitoring across the city.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with ❤️ for smarter, safer cities.</sub>
</p>
