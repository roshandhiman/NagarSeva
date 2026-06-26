# NagarSeva (Community Hero) - Project Brain

This file serves as a memory core and architectural reference for the NagarSeva project. Antigravity AI agents should read this file first to understand the workspace layout, coding patterns, current state, and key systems without having to scan the entire codebase.

---

## 1. Project Overview & Tech Stack
NagarSeva (formerly "community-hero") is a civic issue reporting platform where citizens can report civic issues (like potholes, garbage, exposed wires), track statuses, view a leaderboard, view issues on an interactive map, and interact with a helper AI chatbot (NagBot).

- **Core**: Vanilla HTML5, CSS3, and JavaScript (ES Modules).
- **Build System**: [Vite](https://vite.dev) (configured in [vite.config.js](file:///Users/roshanpreetsinghdhiman/roshan/projects/community-hero/vite.config.js)).
- **Database/Backend**: [Supabase](https://supabase.com) (JS Client) with a robust client-side `localStorage` mock-fallback fallback mechanism.
- **Mapping**: [Leaflet.js](https://leafletjs.com/) for interactive geo-location based issue mapping.
- **AI Integration**: [Groq API](https://groq.com) using `llama-3.1-8b-instant` for duplicate report checks and interactive Q&A helper (NagBot).

---

## 2. Key Directories & File Roles

- **Root HTML Entry Points**:
  - [index.html](file:///Users/roshanpreetsinghdhiman/roshan/projects/community-hero/index.html) - Public Landing Page (about, call-to-actions, mobile-friendly hero section).
  - [dashboard.html](file:///Users/roshanpreetsinghdhiman/roshan/projects/community-hero/dashboard.html) - Core application workspace (map, feed, report forms, leaderboard, profile viewer, and NagBot chat window).

- **Source Code (`/src/`)**:
  - [src/api.js](file:///Users/roshanpreetsinghdhiman/roshan/projects/community-hero/src/api.js) - The backend interface. Exports `supabase`, `useSupabase` flag, and CRUD database functions (e.g., Auth, fetch/create reports, comments, upvotes, leaderboards, user profiles). Automatically falls back to mock browser `localStorage` variables if Supabase config is missing.
  - [src/dashboard.js](file:///Users/roshanpreetsinghdhiman/roshan/projects/community-hero/src/dashboard.js) - The main script running the dashboard page. Manages Leaflet map state, user session validation, modals (report creator, profile detail modal), list feeds, filters, and rendering.
  - [src/ai.js](file:///Users/roshanpreetsinghdhiman/roshan/projects/community-hero/src/ai.js) - AI interface file. Handles:
    1. Duplicate report check (`checkDuplicateReport`) using Groq semantic analysis.
    2. Floating NagBot Chatbot interface (dom injection, event handling, history persistence, client-side off-topic filter, quick-actions).
  - [src/style.css](file:///Users/roshanpreetsinghdhiman/roshan/projects/community-hero/src/style.css) - Monolithic styling sheet (~3300 lines). Contains system variables, design theme (dark/sleek neon-accents), layouts, and mobile media queries (`max-width: 968px`, `max-width: 600px`).
  - [src/main.js](file:///Users/roshanpreetsinghdhiman/roshan/projects/community-hero/src/main.js) - Script driving landing page interactives.
  - [src/cursor.js](file:///Users/roshanpreetsinghdhiman/roshan/projects/community-hero/src/cursor.js) - Custom cursor effect handler.

---

## 3. Core Architectural Patterns

### Authentication & Sessions
- Checks Supabase Auth session via `supabase.auth.getSession()`.
- Falls back to LocalStorage Auth (`ch_session` containing JSON user profile) if Supabase integration is disabled or fails.
- To prevent a quick "login page flash" on slow authentication checks, `dashboard.html` starts with a loaded NagarSeva branded loader element (`#dashboard-loader`) and hides the login wrap (`#login-wrapper`). The loader is programmatically removed once the session status resolves.

### Reporting Flow & AI Duplicate Check
1. User fills out the report creation form (Category, Title, Description, Location, Image).
2. Before publishing, `src/dashboard.js` invokes `checkDuplicateReport(title, description)` from `src/ai.js`.
3. The AI agent analyzes current reports against the new input. If it matches an existing report within threshold guidelines, it warns the user of the match to prevent duplicate entries, offering them the option to upvote the existing issue instead.
4. If approved/unique, the issue is committed to database/localStorage, Leaflet map is updated with a marker, and feed refreshes.

### NagBot (AI Helper Chatbot)
- Initialized in the DOM via `initNagBot()` in `src/ai.js`.
- Answers app-related questions ("How do I report?", "Tell me about badges", "Show my reports status") and civic issue queries.
- Utilizes Groq API's `llama-3.1-8b-instant` model.
- Contains off-topic filter keywords to keep the chatbot relevant to the application's domain.

---

## 4. Environment Configuration
Variables must be declared in `.env` and prefixed with `VITE_` to be bundled by Vite:
- `VITE_SUPABASE_URL` (Supabase API Endpoint)
- `VITE_SUPABASE_ANON_KEY` (Supabase Public Key)
- `VITE_GROQ_API_KEY` (Groq AI Key for NagBot & Duplicate Detection)

---

## 5. Development Reminders & Common Gotchas
1. **Importing Supabase**: In any JS file, always import `supabase` and `useSupabase` from `src/api.js` rather than raw `@supabase/supabase-js` imports to respect the custom environment detection wrapper.
2. **CSS Layouts**: Be careful when editing `src/style.css`. Because layout and dashboard styling are co-located, use classes instead of broad elements to avoid breaking landing page UI elements. Keep mobile-compatibility viewports (`max-width: 968px`) clean and restrict widths using `box-sizing: border-box`.
3. **Mock Data Syncing**: Always ensure that mock databases in `api.js` sync updates to/from `localStorage` correctly when `useSupabase` is false so features work smoothly in offline/demo modes.
