# ID Pirate

> **Next.js 15 + Tailwind v4 + Market-Leading Aesthetics**

This is the codebase for **ID Pirate**, a premium novelty ID ordering platform. It features a "Bold Minimal" glassmorphic design system, strict dark mode, and a robust serverless architecture.

## 🚀 Quick Start

1.  **Install dependencies**:
    ```bash
    npm install
    # Note: Requires Node.js 18+
    ```

2.  **Run the development server**:
    ```bash
    npm run dev
    ```
    *Open [http://localhost:3000](http://localhost:3000) with your browser.*

    > **macOS Note**: If you encounter `EPERM` errors with `node_modules`, standard terminals might lack permissions. Ensure your terminal has Full Disk Access or try re-running.

## 🎨 Design System: "Bold Minimal"

We enforce a strict design language to maintain premium brand value:
- **Dark Mode Only**: Background is always `#09090B`.
- **Glassmorphism**: Cards use the `.glass` utility (`bg-white/[0.04]` + `backdrop-blur`).
- **Typography**: `Inter` for UI, `Pirata One` for branding/headings.
- **Micro-interactions**: `animate-fade-up` on entry, hover lifts on cards.
- **Colors**:
    - Primary Accent: Indigo (`#6366F1`)
    - Prices: Amber (`#F59E0B`) — *Always bold and amber.*

## 🏗️ Architecture

- **Framework**: Next.js 15.3.4 (App Router)
- **Styling**: Tailwind CSS v4
- **State**: React Context (`AuthContext`) + LocalStorage
- **API**: Server-side proxy pattern. Client → `/api/*` Route Handlers → AWS Lambda.
    - *Security*: Lambda URLs are **never** exposed to the client.

## 📂 Key Directories

- `app/globals.css`: **Crucial**. Contains all CSS variables and design tokens.
- `lib/apiClient.ts`: The only place API calls should be made from.
- `lib/constants.ts`: Pricing, state lists, and configuration.
- `app/components/ui/`: Reusable "Bold Minimal" components.

## 📖 Documentation

For a comprehensive deep-dive into the codebase, read **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)**. It covers everything from specific file implementations to the owner's personal preferences.

---
*Built for speed, security, and conversion.*
