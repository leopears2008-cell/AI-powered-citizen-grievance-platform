<div align="center">

<img src="assets/banner.svg" alt="NivaranAI – AI-Powered Citizen Grievance Platform" width="100%"/>

<img src="assets/typing.svg" alt="Animated tagline" width="80%"/>

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
<br/>
[![Gemini](https://img.shields.io/badge/Google%20Gemini-AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Express](https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Node](https://img.shields.io/badge/Node-22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)

![Build](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/YOUR_REPO/deno.yml?branch=main&label=CI&style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)
![Stars](https://img.shields.io/github/stars/YOUR_USERNAME/YOUR_REPO?style=flat-square)

### 🗣️ Speak it &nbsp;→&nbsp; 🤖 AI understands it &nbsp;→&nbsp; 🏛️ Right department fixes it &nbsp;→&nbsp; 📍 You track it

**[🚀 Quick Start](#-quick-start)** · **[✨ Features](#-features)** · **[🏗️ Architecture](#%EF%B8%8F-architecture)** · **[🔐 Security](#-security)** · **[🤝 Contributing](#-contributing)**

</div>

<img src="assets/divider.svg" width="100%" alt=""/>

## 📖 About

**NivaranAI** (*nivaran* = "resolution" in Hindi/Tamil) is an AI-assisted civic grievance management platform. Citizens describe a problem in their own words — by **voice or text, in Tamil, English or Tanglish** — and the platform uses **Google Gemini** to understand it, categorize it, set a priority, and route it to the right municipal department. Citizens then track it in real time, while administrators manage the full resolution workflow from a protected dashboard.

> **The problem:** Citizens often don't know which department owns a pothole, a burst pipe or a dead street light — and complaints get lost in the gap.
> **The fix:** Say it once. NivaranAI figures out the rest.

<img src="assets/divider.svg" width="100%" alt=""/>

## 🎬 How It Works

<div align="center">
<img src="assets/workflow.svg" alt="Animated grievance workflow" width="100%"/>
</div>

<br/>

```mermaid
sequenceDiagram
    autonumber
    actor C as 👤 Citizen
    participant UI as ⚛️ React App
    participant API as 🖥️ Express API
    participant AI as 🧠 Gemini
    participant DB as 🔥 Firestore
    actor A as 🛡️ Admin

    C->>UI: Speaks / types complaint (Tamil · English · Tanglish)
    UI->>API: POST /api/ai/analyze-complaint
    API->>AI: Complaint text (treated as untrusted data)
    AI-->>API: Category · Priority · Department · Summary (EN + TA)
    API-->>UI: Normalized, validated result
    UI->>API: POST /api/ai/check-duplicates
    API-->>UI: Similar open grievances (if any)
    C->>UI: Confirms & submits
    UI->>DB: Create grievance (owner-only rules)
    A->>DB: Review · Assign · Update status
    A->>API: POST /api/ai/suggest-resolution
    API->>AI: Draft resolution note
    DB-->>C: Live status timeline
    C->>DB: Leaves feedback
```

<img src="assets/divider.svg" width="100%" alt=""/>

## ✨ Features

<table>
<tr>
<td width="50%" valign="top">

### 👥 For Citizens
- 🎙️ **Voice complaints** via the Web Speech API — Tamil & English
- ⌨️ **Text fallback** when voice isn't convenient
- 🤖 **Instant AI analysis** — category, priority, department, bilingual summary
- 🔁 **Duplicate detection** before you submit
- 📍 **Location capture** and image evidence (one image, < 400 KB)
- 🔎 **Track by ID** with a full status timeline
- 📚 **My Grievances** history
- ⭐ **Feedback** after resolution
- 🌐 **Bilingual UI** — English / தமிழ்
- 🔒 **No sign-up needed** — private anonymous sessions

</td>
<td width="50%" valign="top">

### 🛡️ For Administrators
- 🔐 **Protected admin login** — verified email + active admin registry
- 📋 **Grievance dashboard** with filters, search & CSV export
- 👮 **Assign** to departments & officers
- 🔄 **8-stage status workflow** with remarks & audit history
- 💡 **AI-drafted resolution notes** (human-verified)
- 📊 **Analytics & SLA views** computed from real records
- 🗺️ **Interactive hotspot map**
- 🧯 **CSV formula-injection protection** on export
- 🔑 **Admin password reset** flow

</td>
</tr>
</table>

### 🗂️ Smart Categories

| | | |
|---|---|---|
| 💡 Street Light | 💧 Water Supply | 🛣️ Roads & Potholes |
| 🚰 Sanitation & Drainage | ⚡ Electricity & Power | 🦟 Public Health & Fogging |
| 🚦 Transport & Traffic | 🌳 Encroachment & Parks | 📌 Other |

### 🚦 Priority & Status Lifecycle

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Submitted
    Submitted --> AI_Classified
    AI_Classified --> Assigned
    Assigned --> Under_Review
    Under_Review --> In_Progress
    In_Progress --> Resolved
    Resolved --> Reopened: citizen disagrees
    Reopened --> In_Progress
    Under_Review --> Rejected
    Resolved --> [*]
```

Priorities: 🔴 **Critical** · 🟠 **High** · 🟡 **Medium** · 🟢 **Low**

<img src="assets/divider.svg" width="100%" alt=""/>

## 🏗️ Architecture

<div align="center">
<img src="assets/architecture.svg" alt="System architecture" width="100%"/>
</div>

### 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS 4, Motion, Recharts, Lucide, canvas-confetti |
| **Backend** | Node.js 22, Express 4, `tsx` (dev), `esbuild` (prod bundle) |
| **AI** | Google Gemini via `@google/genai` (server-side only) |
| **Auth** | Firebase Authentication — anonymous citizens, email/password admins |
| **Database** | Cloud Firestore with least-privilege security rules |
| **CI** | GitHub Actions — install, type-check, production build |

### 📁 Project Structure

```text
├── server.ts                  # Express server: AI endpoints, auth guards, security headers
├── firestore.rules            # Least-privilege Firestore security rules
├── firebase-blueprint.json    # Firestore data model
├── scripts/
│   └── provision-admin.mjs    # Grants admin access to a Firebase user
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── HeroSection.tsx        # Landing page
│   │   ├── VoiceInputModal.tsx    # Tamil/English speech capture
│   │   ├── GrievanceForm.tsx      # AI-assisted filing flow
│   │   ├── CitizenTracker.tsx     # Status timeline
│   │   ├── CitizenHistory.tsx     # My grievances
│   │   ├── AdminLogin.tsx         # Protected admin sign-in
│   │   ├── AdminDashboard.tsx     # Admin workflow
│   │   ├── AnalyticsView.tsx      # Charts & SLA
│   │   ├── InteractiveMap.tsx     # Hotspot map
│   │   └── LegalPage.tsx          # Privacy · Terms · Cookies
│   ├── context/AppContext.tsx     # Global state (language, auth, navigation)
│   ├── services/api.ts            # API + Firestore client
│   ├── locales/translations.ts    # English / தமிழ் strings
│   └── types.ts
└── .github/workflows/         # CI pipeline
```

<img src="assets/divider.svg" width="100%" alt=""/>

## 🚀 Quick Start

### Prerequisites
- **Node.js 22+**
- A **Firebase** project (Authentication + Firestore)
- A **Google Gemini API key** → [Get one here](https://aistudio.google.com/apikey)

### 1️⃣ Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
```

### 2️⃣ Configure environment
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Gemini API key — **server-only**, never sent to the browser |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Firebase Admin service-account JSON (single line) |
| `ADMIN_EMAILS` | Comma-separated allowlist of admin emails for server-side APIs |

> Client-safe Firebase config lives in `firebase-applet-config.json`. Replace it with **your own** Firebase project's config.

### 3️⃣ Set up Firebase
1. In the Firebase console, enable **Authentication → Anonymous** and **Email/Password**.
2. Create the Firestore database and deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Create an admin user in Firebase Authentication and **verify their email**.
4. Provision admin access:
   ```bash
   npm run provision-admin -- admin@example.com
   ```

### 4️⃣ Run it
```bash
npm run dev          # development server → http://localhost:3000
```

```bash
npm run build        # production build (Vite + bundled server)
npm start            # run the production server
npm run lint         # TypeScript type-check
```

<img src="assets/divider.svg" width="100%" alt=""/>

## 🔐 Security

Security was treated as a first-class feature, not an afterthought:

| Area | Protection |
|---|---|
| 🔑 **Secrets** | Gemini key and Firebase Admin credentials stay server-side |
| 🛡️ **Firestore** | Citizens read/write only their own grievances; admin registry is not writable from clients |
| 👮 **Admin access** | Verified email + active `admins/{uid}` record + server allowlist |
| 🚦 **API** | Rate limiting, 1 MB body cap, 10 000-char AI input cap |
| 🧱 **Headers** | CSP, HSTS, frame protection, `nosniff`, Referrer-Policy, Permissions-Policy |
| 🧠 **AI safety** | Complaint text treated as untrusted; output normalized to allowed categories, priorities & departments |
| 📄 **CSV export** | Neutralizes `=`, `+`, `-`, `@` formula injection |
| 🖼️ **Uploads** | One image, size-capped, enforced in Firestore rules |

> ⚠️ **AI output is assistive.** Consequential administrative actions should always be verified by a human.
>
> ⚠️ **Compliance:** the included Privacy / Terms pages are templates, not legal advice. Review them against your own data flows and applicable law (e.g. India's DPDP Act, 2023) before going live. See [`PRODUCTION_AUDIT.md`](PRODUCTION_AUDIT.md) for the full audit and launch checklist.

<img src="assets/divider.svg" width="100%" alt=""/>

## 🗺️ Roadmap

- [ ] Move evidence uploads to dedicated object storage (Firebase Storage / GCS)
- [ ] Persistent, access-controlled notification store (SMS / email / push)
- [ ] Additional Indian languages (Hindi, Telugu, Kannada, Malayalam)
- [ ] Officer field-app with photo proof of resolution
- [ ] Automated tests & end-to-end browser coverage
- [ ] Public transparency dashboard

## 🤝 Contributing

Contributions are welcome!

1. 🍴 Fork the repository
2. 🌿 Create a branch: `git checkout -b feature/amazing-idea`
3. 💾 Commit: `git commit -m "feat: add amazing idea"`
4. 📤 Push: `git push origin feature/amazing-idea`
5. 🔀 Open a Pull Request

Please run `npm run lint` before submitting.

## 📄 License

Distributed under the **MIT License**. Add a `LICENSE` file to your repository to make this official.

## 🙏 Acknowledgements

[Google Gemini](https://ai.google.dev) · [Firebase](https://firebase.google.com) · [React](https://react.dev) · [Vite](https://vitejs.dev) · [Tailwind CSS](https://tailwindcss.com) · [Recharts](https://recharts.org) · [Lucide](https://lucide.dev) · [Shields.io](https://shields.io)

<div align="center">

<img src="assets/divider.svg" width="100%" alt=""/>

**Built with ❤️ for citizens who deserve to be heard.**

⭐ **If this project helps you, give it a star!** ⭐

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=38BDF8&center=true&vCenter=true&width=500&lines=Voice+%E2%86%92+AI+%E2%86%92+Action;Every+grievance+matters.;%E0%AE%B5%E0%AE%BE%E0%AE%AF%E0%AF%8D%E0%AE%AE%E0%AF%88%E0%AE%AF%E0%AF%87+%E0%AE%B5%E0%AF%86%E0%AE%B2%E0%AF%8D%E0%AE%B2%E0%AF%81%E0%AE%AE%E0%AF%8D" alt="footer typing"/>

</div>

