# Quadratic Solver

An interactive quadratic equation solver with live graph, built with React + Vite.

## Local Development

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Deploy to Vercel

### Option A — Vercel CLI (recommended)
```bash
npm install -g vercel
vercel
```
Follow the prompts. Vercel will auto-detect Vite and deploy.

### Option B — GitHub + Vercel Dashboard
1. Push this folder to a GitHub repo
2. Go to https://vercel.com/new
3. Import your repo
4. Vercel auto-detects the settings from `vercel.json` — just click **Deploy**

## Project Structure

```
quadratic-solver/
├── index.html          # HTML entry point
├── vite.config.js      # Vite config
├── vercel.json         # Vercel deployment config
├── package.json
└── src/
    ├── main.jsx        # React entry point
    └── App.jsx         # Main solver component
```
