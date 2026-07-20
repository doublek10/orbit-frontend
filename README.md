# Orbit Frontend - The Display

## Purpose

This repository contains the Orbit frontend application. Its only
responsibility is to present information to the user and collect user
input. It holds no secrets, makes no business decisions, and - as of this
version - talks to nothing except the Gateway. Not Supabase, not
Postgres, not the Kernel directly. Everything the user submits travels
through the Gateway to the Kernel and back.

```
Frontend  →  Gateway  →  Orbit Kernel  →  Everything
(display)    (security     (the brain)     (Supabase for identity,
              guard)                        Postgres for the rest)
```

---

## Worked example: sign up

```
1. User fills in the register form: email, password, company name.
   RegisterPage submits via useAuth().signUp(...).

2. AuthContext → authService.signUp()
   POST to gateway.post("/auth/signup", { email, password, company_name })
   This is a PLAIN HTTP call to the Gateway. The Frontend does not touch
   Supabase, does not generate a token, does not know Supabase exists.

3. gateway.ts → fetch("/gateway/auth/signup", { credentials: "include" })
   next.config.ts rewrites this to the real Gateway's
   POST /api/auth/signup.

4. Gateway validates the request SHAPE only (valid email, password
   length, company_name present) and forwards it, unchanged, to the
   Kernel's POST /kernel/v1/auth/signup.

5. Kernel:
     a. Calls Supabase's Admin API to create the identity.
        Supabase returns a UUID for the new user.
     b. Uses that UUID to write company + owner-membership rows into
        the Kernel's own self-hosted Postgres (VPN/private network) -
        this is one atomic transaction, so a Supabase user can never
        exist without a matching company row, or vice versa.
     c. Signs the new user in via Supabase to get an access/refresh
        token pair.
     d. Returns { identity, company, session } to the Gateway.

6. Gateway stores the access/refresh tokens as httpOnly cookies (it
   never reads or decodes them), normalizes the Kernel's response into
   one flat session shape, and returns { session } to the Frontend.

7. AuthContext stores the session in React state. RegisterPage redirects
   to /overview. If anything failed at step 5 (duplicate email, a
   Postgres constraint, Supabase being unreachable), the Kernel returns
   an error, the Gateway relays it verbatim, and this page shows it
   directly on the form - nothing is silently swallowed along the way.
```

Login and "am I still signed in" (`getSession()`) follow the identical
path - see `src/core/services/auth.service.ts`.

---

## Repository Structure

```
orbit-frontend/
├── README.md
├── middleware.ts        # soft route guard (real check happens at the Gateway/Kernel)
├── next.config.ts        # rewrites /gateway/* → GATEWAY_URL/api/*
├── package.json / tsconfig.json / tailwind.config.ts
│
├── src/
│   ├── app/
│   │   ├── (marketing)/      # public pages - currently just src/app/page.tsx
│   │   ├── (auth)/login/, register/
│   │   ├── (dashboard)/layout.tsx, overview/
│   │   ├── (settings)/settings/  (developer)/developer/
│   │   ├── (marketplace)/marketplace/  (enterprise)/enterprise/
│   │   ├── layout.tsx page.tsx loading.tsx error.tsx not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/            # Button, Input, Card
│   │   ├── shared/         # OrbitMark, AuthGate
│   │   └── dashboard/ charts/ financial/ workflow/ replay/ ai/
│   │       marketplace/ enterprise/    # empty - fill in per Kernel capability
│   │
│   ├── core/
│   │   ├── gateway/        # gateway.ts is the ONLY HTTP entry point
│   │   ├── services/        # auth.service.ts + one stub per domain
│   │   ├── auth/             # empty - Frontend has no identity-provider integration
│   │   ├── websocket/        # reserved, not implemented
│   │   ├── config/            # env.ts
│   │   └── utils/
│   │
│   ├── hooks/ useSession.ts
│   ├── contexts/ AuthContext.tsx
│   ├── stores/            # reserved, empty
│   ├── types/ session.ts
│   ├── styles/ globals.css
│   └── assets/
```

---

## Responsibilities

The frontend is responsible for: rendering pages, dashboards, navigation,
client state, charts, notifications, forms, file uploads, WebSocket
connections, displaying AI responses.

The frontend is **not** responsible for: talking to Supabase, talking to
Postgres, authentication decisions, business rules, workflow execution,
financial calculations, provider communication, AI decision making. Every
one of those belongs to the Gateway and, ultimately, the Kernel.

---

## Local Setup

1. `cp .env.example .env` and set `GATEWAY_URL` (e.g.
   `http://localhost:3001` if running orbit-gateway locally on that
   port). That's the only environment variable this app needs.
2. `npm install`
3. `npm run dev` (defaults to `http://localhost:3000`)
4. With the Gateway and Kernel both running (and the Kernel's `.env`
   pointed at a real Supabase project + Postgres instance), visit
   `/register` and create an account end to end.

---

## Development Rules

1. Pages only render data.
2. Components only display UI.
3. Hooks manage frontend behaviour.
4. Services contain application use-cases - and nothing that talks to Supabase, ever.
5. `gateway.ts` is the only HTTP entry point.
6. No page may call `fetch()` directly.
7. No component may communicate with the Gateway or Kernel directly.
8. No business logic may exist in the frontend.
9. Every backend request must go through the Gateway Client.
10. The frontend must remain replaceable without changing backend behaviour.
