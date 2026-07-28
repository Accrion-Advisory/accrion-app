# Accrion Advisory CRM

A behavioral financial advisory CRM built for independent financial advisors. Accrion helps advisors track client behavioral patterns, log decisions, manage goals, and run structured review cycles — while giving clients a clean portal to view their financial plan and book review calls.

---

## Features

**Advisor**
- Client profiles with behavioral scoring (stated vs revealed risk, temperament, panic threshold)
- Behavioral flag tracking and resolution
- Decision log with emotional context and outcomes
- Goal tracking across categories (retirement, education, property, etc.)
- Review cycle management — schedule, complete, and add drift assessments
- Set weekly active hours for client bookings
- Dashboard with open flags, upcoming reviews, and recent activity

**Client Portal**
- View behavioral summary, goals, and decision history
- See assigned advisor and book a 1-hour review call
- Reschedule or cancel upcoming calls
- Slot picker respects advisor active hours and existing bookings

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| UI Components | Lucide React, Recharts, Framer Motion |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v20 or higher
- A free [Supabase](https://supabase.com) account

### 1. Clone the repository

```bash
git clone https://github.com/your-username/accrion-advisory-crm.git
cd accrion-advisory-crm
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase project URL, anon key, and service role key. You can find these in your Supabase dashboard under **Project Settings → API**.

### 4. Set up the database

Install the [Supabase CLI](https://supabase.com/docs/guides/cli) if you haven't already, then link it to your project and push the migrations:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

This runs the three files in `supabase/migrations/` in order — schema, auth sync triggers, and RLS policies.

Optionally, seed a demo advisor and client:

```bash
npm run seed
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Credentials

After running the seed data:

| Role | Email | Password |
|---|---|---|
| Advisor | tanay@accrion.co | advisor123 |
| Client | arjun.mehta@email.com | client123 |

---

## Project Structure

```
accrion/
├── app/
│   ├── advisor/          # Advisor-facing pages (dashboard, clients, reviews, settings)
│   ├── client/           # Client portal
│   ├── api/              # API routes
│   └── login/            # Login page
├── components/
│   ├── advisor/          # Advisor UI components
│   └── ui/               # Shared UI primitives (Card, Badge, Tabs, etc.)
├── lib/
│   ├── data/             # Supabase data access functions
│   ├── supabase/         # Supabase client setup
│   └── types.ts          # Shared TypeScript types
├── scripts/
│   └── seed.mjs          # Demo advisor/client seed script
└── supabase/
    ├── config.toml         # Supabase CLI project config
    └── migrations/         # Schema, auth sync, and RLS policies (run via `supabase db push`)
```

---

## Database

The schema is fully documented across `supabase/migrations/`. Key tables:

- `users` — advisors and clients
- `clients` — client profiles with behavioral data
- `goals` — financial goals per client
- `behavioral_flags` — flagged behavioral events
- `decision_log` — all client decisions with context
- `review_cycles` — scheduled and completed review calls
- `action_items` — follow-ups from reviews
- `communications` — communication history
- `behavioral_snapshots` — point-in-time behavioral scores
- `advisor_availability` — weekly booking schedule per advisor

---

## License

Private. All rights reserved.
