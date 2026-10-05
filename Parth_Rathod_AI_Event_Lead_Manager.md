# AI Event Lead Manager

## 1. Project Overview

The **AI Event Lead Manager** is a focused, responsive customer relationship management (CRM) application engineered for business development, sales, and partnership teams attending conferences, summits, and networking events. In fast-paced event environments, professionals meet dozens of attendees each day and capture fragmented, unstructured notes across conversations. Without a systematic capture and synthesis process, critical context is lost, and timely follow-ups are delayed.

The application resolves this problem by providing a streamlined, mobile-friendly interface for immediate lead capture, structured PostgreSQL persistence via Supabase, and integrated server-side AI. By automating conversational note summarization and generating tailored, contextual follow-up email drafts in seconds, the platform eliminates post-event administrative overhead and accelerates the conversion cycle from initial handshake to qualified opportunity.

---

## 2. Key Features

- **Lead Creation**: Capture essential attendee details including full name, company, email address, event/conference name, follow-up status, and conversational notes with client- and server-side validation.
- **Lead Viewing & Details**: Comprehensive lead detail views showing structured contact info, event metadata, creation/update timestamps, and dedicated AI action panels.
- **Lead Editing**: Inline editing capabilities allowing teams to update contact details, event context, interaction notes, and pipeline status.
- **Lead Deletion**: Secure deletion flow with confirmation protection to prevent accidental removal of records.
- **Real-Time Search**: Instant full-text search across attendee names, companies, email addresses, and event names.
- **Multi-Status Filtering**: Tabbed filtering by follow-up status (`Pending`, `Contacted`, `Completed`) paired with real-time KPI counter cards.
- **Follow-up Status Management**: One-click status transitions enabling sales reps to track each lead from initial meeting to completed engagement.
- **Persistent Database Storage**: Production-grade relational persistence in Supabase PostgreSQL featuring UUID primary keys, indexes on queried dimensions, and automated `updated_at` database triggers.
- **AI Note Summarization**: Server-side extraction of key pain points, expressed interests, and concrete action items from raw meeting notes.
- **AI Follow-up Generation**: Context-aware follow-up email drafting referencing the specific event and conversation points, accompanied by a one-click clipboard copy utility.
- **Responsive B2B Interface**: Mobile-first responsive layout with accessible contrast, empty states, loading skeletons, and interactive state feedback across phone, tablet, and desktop screens.

---

## 3. Technology Stack

| Area | Technology |
|------|------------|
| Frontend | Next.js 16 (App Router), React 19, Lucide React |
| Language | TypeScript 5 (Strict Mode) |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Supabase (Row Level Security enabled) |
| Backend/API | Next.js Route Handlers (Serverless Architecture) |
| AI | Google Gemini (`gemini-flash-lite-latest`) with server-side provider abstraction |
| Validation | Zod 4 (Shared client and server schemas) |
| Testing | Bun Test (25 unit and schema validation tests) |
| Deployment | Vercel (Global Edge Hosting) & Supabase (Managed Cloud Database) |

---

## 4. How It Works

### Application Data Flow

```
User Browser (Desktop / Mobile UI)
         │
         ▼
Next.js Server Layer (Route Handlers & Server Components)
         │
         ├── Server-Side Zod Validation (Input Sanitation & Boundary Checks)
         │
         ▼
Supabase PostgreSQL Database (Row Level Security & Indexed Queries)
```

1. The user interacts with the responsive interface to view, create, edit, or filter leads.
2. Form submissions and mutations dispatch asynchronous requests to Next.js route handlers (`/api/leads`, `/api/leads/[id]`).
3. The server layer validates inputs using strict Zod schemas before interacting with the database.
4. The database layer executes queries against Supabase PostgreSQL using the privileged service-role connection, returning normalized JSON payloads to the frontend.

### AI Processing Flow

```
User Clicks AI Action (Lead Detail View)
         │
         ▼
Next.js AI Route Handler (/api/ai/summarize or /api/ai/followup)
         │
         ├── Server-Side Gemini API Request (Credentials kept private on server)
         │
         ▼
Google Gemini LLM (gemini-flash-lite-latest)
         │
         ▼
Structured Result Rendered in UI (Instant 1-Click Copy Utility)
```

1. In the lead detail view, the user triggers **Summarize Notes** or **Draft Follow-up**.
2. The browser sends only the necessary context (lead name, company, event, notes) to `/api/ai/summarize` or `/api/ai/followup`.
3. The server route authenticates with the Google Gemini API using server-side environment variables. API credentials are never bundled in client code or exposed in browser network inspection.
4. Gemini processes the structured prompt and returns a strictly grounded response.
5. The result is returned to the UI and rendered in dedicated cards with one-click copy functionality.

---

## 5. AI Integration

The application integrates two purpose-built AI workflows engineered specifically for conference lead management:

### 1. Notes Summarization (`/api/ai/summarize`)
- Analyzes raw conversational notes entered during or immediately after a meeting.
- Extracts core context: **Lead Context**, **Core Pain Points**, **Expressed Interests**, and **Actionable Next Steps**.
- Applies prompt guardrails that enforce conciseness (< 120 words) and strictly forbid inventing unmentioned commitments, pricing, or dates.

### 2. Follow-up Email Generation (`/api/ai/followup`)
- Synthesizes attendee name, company, conference name, and interaction notes.
- Generates a polished, professional email draft including a relevant subject line, cordial greeting, explicit reference to the event discussion, and a proposed next step.
- Provides immediate copy-to-clipboard functionality for seamless transfer into email clients.

### Safety, Architecture & Fallback Behavior
- **Server-Side Isolation**: All AI provider integrations reside entirely in `lib/ai/` and execute within serverless Route Handlers.
- **Provider & Model**: Configured in production with Google Gemini using the `gemini-flash-lite-latest` model for fast latency and high reasoning accuracy.
- **Deterministic Local Fallback**: If external API credentials are not supplied or if the external provider encounters network disruptions or rate limits, the system automatically falls back to an internal deterministic natural language extraction engine. This ensures the application remains functional without crashing.

---

## 6. Database & Security

### Database Architecture
Data persistence is handled by PostgreSQL hosted on Supabase. The schema is defined in `supabase/migrations/001_create_leads_table.sql`:

- **Primary Keys**: UUIDs generated via `gen_random_uuid()` to prevent predictable enumeration attacks.
- **Constraints**: Mandatory `NOT NULL` constraints on core contact fields and a `CHECK` constraint restricting `follow_up_status` to `('pending', 'contacted', 'completed')`.
- **Automated Triggers**: A PostgreSQL trigger executes on `BEFORE UPDATE` to keep `updated_at` timestamps accurate without relying on client-side clocks.
- **Performance Indexes**: Dedicated indexes on `follow_up_status`, `event`, `company`, `name`, `email`, and `created_at` ensure fast search and filter queries at scale.

### Security Posture & Credential Protection
- **Row Level Security (RLS)**: RLS is strictly enabled on `public.leads`. Public/anonymous queries (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) are restricted to read-only access.
- **Service-Role Backend Access**: Authoritative write operations (INSERT, UPDATE, DELETE) are executed exclusively on the server using `SUPABASE_SERVICE_ROLE_KEY`.
- **Zero Secrets in Repository**: `.env.local` is explicitly listed in `.gitignore` and has never been committed. All API keys and connection secrets remain securely stored in environment configurations.
- **Input Sanitization**: All incoming mutation payloads undergo schema validation via Zod, rejecting unexpected fields or malformed inputs.

---

## 7. Testing & Verification

The application has been verified through automated test suites, static analysis, type checking, and production compilation:

- **Automated Unit & Validation Tests**: **25/25 tests passed** (executed via Bun Test across `tests/aiServices.test.ts`, `tests/leadsRepository.test.ts`, and `tests/leadValidation.test.ts`).
  - *Lead Schema Validation*: Valid inputs, boundary limits, invalid email patterns, whitespace trimming, and status constraints.
  - *Repository Operations*: Full CRUD lifecycle, UUID assignment, timestamp verification, combined search and status filtering, and safe non-existent ID handling.
  - *AI Services*: Context extraction, parameter validation, and prompt integrity.
- **TypeScript Static Verification**: **0 errors** (`bun x tsc --noEmit` executed cleanly under strict mode).
- **ESLint Code Quality**: **0 errors, 0 warnings** (`bun run lint` passing across all source directories).
- **Production Build Verification**: **Successful compilation** via Next.js Turbopack (`bun run build`), verifying pre-rendering and route generation across all 9 static and dynamic routes.

---

## 8. Local Setup

Follow these steps to run the application locally:

### 1. Clone the repository
```bash
git clone https://github.com/PaRth0566/ai-event-lead-manager.git
cd ai-event-lead-manager
```

### 2. Install dependencies
```bash
bun install
# or
npm install
```

### 3. Configure environment variables
Create a `.env.local` file at the root of the project:
```bash
cp .env.example .env.local
```
Populate the environment variables listed in Section 9 with your project credentials.

### 4. Database Setup
1. In your Supabase dashboard, open the **SQL Editor**.
2. Run the migration script located at `supabase/migrations/001_create_leads_table.sql`.
3. (Optional) Run `supabase/seed.sql` to populate sample event leads.

### 5. Start the development server
```bash
bun run dev
# or
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 9. Environment Variables

The application utilizes the following environment variables:

| Variable Name | Environment | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Supabase project endpoint URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Supabase public anonymous API key (Read-only under RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-Only | Privileged secret key for server-side database mutations |
| `AI_PROVIDER` | Server-Only | Active AI provider identifier (`gemini`) |
| `GEMINI_API_KEY` | Server-Only | Google Gemini API credential |
| `AI_MODEL` | Server-Only | Target LLM model name (`gemini-flash-lite-latest`) |

> *Note: Secret values are intentionally not included in this document or repository.*

---

## 10. Project Links

- **GitHub Repository**: https://github.com/PaRth0566/ai-event-lead-manager
- **Live Deployment**: https://ai-event-lead-manager.vercel.app

---

## 11. Design & Engineering Decisions

1. **Next.js App Router Architecture**: Selected to unify the React presentation tier and serverless backend API in a single typed codebase, eliminating CORS complexity and infrastructure overhead for a focused CRM service.
2. **Supabase / Relational PostgreSQL**: Chosen over document databases to enforce strict relational integrity, check constraints on status states, and indexed query performance on multi-dimensional filters (`status`, `company`, `event`).
3. **Server-Side AI Abstraction**: AI invocations are isolated behind backend route handlers rather than client SDKs. This safeguards private API keys and permits provider swapping (OpenAI, Gemini) with zero frontend changes.
4. **Dual-Tier Zod Validation**: Validating inputs on the client ensures immediate UI feedback, while re-validating on the server ensures database integrity against direct or malformed API requests.
5. **Decoupled Repository Pattern**: Application routes communicate with a repository abstraction (`lib/db/leads.ts`) rather than embedding raw SQL queries in UI views, enabling clean code separation and seamless testability.
6. **Purpose-Driven B2B UX**: Designed around quick data entry with auto-focused inputs, accessible contrast, mobile-friendly layouts, and purposeful micro-interactions rather than distracting animations.

---

## 12. Submission Notes

This submission package contains:
- **Public GitHub Repository** with clean commit history, complete documentation, and automated tests.
- **Live Deployed Application** hosted on Vercel with real-time response times.
- **Persistent Cloud Database** configured on Supabase with Row Level Security and schema migrations.
- **Production AI Features** powered server-side by Google Gemini with deterministic fallback handling.
- **Automated Test Suite** with 25 passing unit and validation tests.
