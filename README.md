# Koment

<p align="center">
  <strong>Next-Gen Event Management &amp; Esports Tournament SaaS Platform</strong>
</p>

<p align="center">
  <a href="https://github.com/koamishin/koment">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
  </a>
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-14_App_Router-black.svg" alt="Next.js 14" />
  </a>
  <a href="https://trpc.io">
    <img src="https://img.shields.io/badge/tRPC-v10-2563eb.svg" alt="tRPC" />
  </a>
  <a href="https://tailwindcss.com">
    <img src="https://img.shields.io/badge/TailwindCSS-v3.4-38bdf8.svg" alt="TailwindCSS" />
  </a>
</p>

---

## 🌟 Overview

**Koment** is a modern, enterprise-ready SaaS platform built for event managers, gaming leagues, universities, and tournament organizers. It combines comprehensive event management (registration, custom attendee form builder, QR check-in door ops) with an interactive **Esports Tournament Maker** capable of generating automated elimination brackets, seeding rosters, and tracking live match scores.

---

## 🚀 Key Features

### 🎮 Esports Tournament Maker
- **Automated Bracket Generation**: 4, 8, 16, 32, 64-slot single and double elimination match brackets with automatic bye-routing and power-of-2 seed calculation.
- **Roster & Seeding Management**: Register team captains, Discord handles, and player rosters with customizable seeds.
- **Live Match Scoring Studio**: Real-time match scoring, winner advancement to next round, match status flags (Pending, Scheduled, Live, Completed), and broadcast / VOD linking.
- **Champion Highlight**: Automated tournament completion and winner crowning banner upon Grand Finals conclusion.
- **Multi-Game Support**: Presets for Valorant, Counter-Strike 2, League of Legends, Rocket League, Dota 2, Smash Bros, Apex Legends, or any custom competitive title.

### 🎫 Event Management & Door Operations
- **Dynamic Registration Fields**: Collect attendee information with text, dropdowns, email, phone, and custom checkboxes.
- **Capacity & Approval Queues**: Set attendee maximums and approve registrations on demand.
- **Fast QR Check-in**: Scan mobile passes via camera or enter 10-character codes manually for instantaneous verification.

### 🏢 Workspace Multi-Tenancy & Security
- **Role-Based Access Control**: Team permissions divided into Owner, Admin, Staff, and Member.
- **Clerk & NextAuth Authentication**: Secure passwordless and social SSO authentication.
- **Stripe Billing Integration**: Tiered subscription plans (Free, Pro, Business).

### 🌍 Internationalization (i18n)
- Native multi-language support:
  - English (`/en`)
  - 中文 (`/zh`)
  - 日本語 (`/ja`)
  - 한국어 (`/ko`)

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **API Layer**: [tRPC v10](https://trpc.io/) with end-to-end TypeScript safety
- **Database & ORM**: PostgreSQL, [Prisma](https://www.prisma.io/) schema, and [Kysely](https://kysely.dev/) query builder
- **Auth**: [Clerk](https://clerk.com/) & NextAuth
- **Styling & UI**: Tailwind CSS, Radix UI Primitives, Lucide Icons, Framer Motion
- **Monorepo Tooling**: [Turborepo](https://turbo.build/) & [Bun](https://bun.sh/)

---

## ⚡ Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.1+) or Node.js (v18+)
- PostgreSQL database instance

### Installation

1. **Clone repository**:
   ```bash
   git clone https://github.com/koamishin/koment.git
   cd koment
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env.local` and populate your database and authentication keys:
   ```bash
   cp .env.example .env.local
   ```

4. **Push database schema**:
   ```bash
   bun run db:push
   ```

5. **Start development server**:
   ```bash
   bun run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Project Structure

```text
koment/
├── apps/
│   ├── nextjs/          # Next.js 14 web application & UI routes
│   └── auth-proxy/      # Authentication edge proxy
├── packages/
│   ├── api/             # tRPC API router (events, tournaments, check-in, orgs)
│   ├── auth/            # Auth adapters and session helpers
│   ├── db/              # Prisma schema & Kysely query client
│   ├── stripe/          # Stripe webhooks & subscription billing
│   └── ui/              # Shared design system components & icons
└── tooling/
    ├── eslint-config/   # Shared ESLint configuration
    ├── prettier-config/ # Shared Prettier formatting rules
    └── tailwind-config/ # Shared Tailwind CSS preset
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
