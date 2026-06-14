# Ledger — Offline Mobile AIS (React Native / Expo)

Offline-first bookkeeping for sole proprietors. Data lives on the device in a single SQLite file.

## Stack
- Expo SDK 51 + expo-router (file-based routing)
- JavaScript (no TypeScript)
- NativeWind v4 (Tailwind for React Native)
- expo-sqlite (synchronous API)
- Navy + white "Trust & Finance" theme

## Run
```bash
cd expo-app
npm install        # or: bun install / pnpm install
npx expo start
```
Scan the QR code with **Expo Go** on Android/iOS, or press `i` / `a` for a simulator.

> The Lovable web preview cannot render Expo apps — run locally.

## File map
- `app/` — screens (expo-router)
- `src/lib/db.js` — SQLite open/exec helpers, schema bootstrap
- `src/lib/accounting.js` — double-entry engine (recordSale / Purchase / Expense, reports)
- `src/lib/schema.js` — DDL + seed chart of accounts
- `src/components/ui/` — Button, Input, Card, RadioGroup, etc.

## Backup
The `Backup` screen exports/imports the raw SQLite file using `expo-file-system` + `expo-sharing`.

## Parity vs the web build
Carried over: setup wizard, sales (goods + services), purchases, expenses, inventory, cash/momo accounts, income statement, balance sheet, opening balances, weighted-avg costing, low-stock alerts.
Deferred: PDF export (add `expo-print` if needed), PIN lock.