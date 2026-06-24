# 🏛️ NagarSeva (Community Hero)

[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD627)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://css3.info/)

> **Empowering citizens to report civic issues and helping authorities resolve them in real-time.** 
> NagarSeva bridges the gap between citizens and municipal corporations through interactive mapping, instant reporting, and gamified community action.

---

## ✨ Features

- 🛰️ **Automatic GPS Location Map:** Pans directly to your current location on load so you can immediately see active issues around you.
- 📍 **Interactive Incident Radar:** Click anywhere on the map to drop a pin and quickly file a report for pothole damage, garbage build-up, water leakage, or general hazards.
- 🔑 **Flexible Authentication System:** Sign in instantly via **Google OAuth** or use your credentials. Supports both **Email and Username-based logins**.
- 🛠️ **Municipal Command Center (Admin):** Dedicated dashboard for authority users to review citizen tickets, track statuses (Reported ➡️ Under Review ➡️ Resolved), and trigger fixes.
- 🏆 **Gamified Leaderboard:** Earn points (+50 for submitting a report, +100 when an issue is resolved!) and climb the ranks to earn badges like *Street Sentinel* and *Municipal Magnet*.
- 💫 **Premium Aesthetics:** Vibrant dark-mode interface with a glowing particle constellation background and modern interactive typography.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, Vanilla CSS3 (Custom Glassmorphic styles), JavaScript (ES6 Modules)
- **Maps:** Leaflet.js with OpenStreetMap layers
- **Backend & Database:** Supabase (PostgreSQL, Real-time engine, Auth, and Storage Buckets)
- **Build Tool:** Vite

---

## ⚡ Getting Started

### 📋 Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 🚀 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/roshandhiman/NagarSeva.git
   cd NagarSeva
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## 🗄️ Database Setup (Supabase)

To prepare your Supabase backend, execute the following SQL schema in the **Supabase SQL Editor**:

```sql
-- 1. Create Users Table
CREATE TABLE public.users (
  user_id UUID PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT,
  points INTEGER DEFAULT 50,
  badges TEXT[] DEFAULT '{First Responder}'::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create Reports Table
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

-- 3. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on users" ON public.users FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on reports" ON public.reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on reports" ON public.reports FOR UPDATE USING (true);

-- 4. Storage Bucket Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('community_hero_bucket', 'community_hero_bucket', true);
CREATE POLICY "Allow public read on bucket" ON storage.objects FOR SELECT USING (bucket_id = 'community_hero_bucket');
CREATE POLICY "Allow public upload on bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'community_hero_bucket');
```

---

## 🎨 User Interface Preview

### Citizen Portal
> A beautiful cockpit containing real-time GPS locations, quick filing modals, user progress cards, and live leaderboard status.

### Municipal Command Center
> Specialized grid panel listing open complaints with quick actions to transition tickets through workflow states.

---

## 📄 License

This project is licensed under the MIT License.
