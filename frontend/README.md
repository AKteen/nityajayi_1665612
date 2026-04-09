# Frontend — Next.js

## Stack

- **Next.js 14** — React framework (App Router)
- **Tailwind CSS** — styling
- **shadcn/ui** — component library

## Setup

### 1. Create Next.js app (if not already done)

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
```

### 2. Install dependencies

```bash
npm install
```

### 3. Install recommended packages

```bash
# UI components
npx shadcn@latest init
npx shadcn@latest add button input card

# HTTP client
npm install axios

# State management
npm install zustand

# Forms
npm install react-hook-form zod @hookform/resolvers
```

### 4. Configure environment

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 5. Run dev server

```bash
npm run dev
```

App available at `http://localhost:3000`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
