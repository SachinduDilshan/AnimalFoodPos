# Animal Food POS

Offline desktop POS + inventory app for an animal food shop. Runs on a single
Windows PC with a thermal receipt printer. No internet, no cloud, no external
database server.

## Stack

- Electron desktop shell (packaged with electron-builder)
- Backend: Node + Express (CommonJS), embedded inside Electron's main process
- Database: SQLite via better-sqlite3 (synchronous API)
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + react-router-dom + axios

## Structure

- `electron/main.js` — starts the backend, opens the BrowserWindow
- `backend/src/app.js` — `createApp(db)` builds the Express app, does NOT listen
- `backend/src/server.js` — `startServer({ dbPath, port })` opens the DB, runs
  migrations, and listens
- `backend/src/dev.js` — standalone dev runner against `backend/dev.db`, for
  testing routes with Postman/curl without Electron
- `backend/src/db/connection.js` — `openDb(dbPath)`: enables WAL + foreign_keys,
  runs pending migrations
- `backend/src/db/migrations/*.sql` — numbered, applied in order inside a
  transaction, tracked in `schema_version`
- `frontend/src/api/client.js` — axios instance, `baseURL: http://127.0.0.1:5178/api`

## Conventions

- **Money is always integer cents (LKR).** Never store or compute money as a
  float. Use `backend/src/utils/money.js` (`toCents`, `fromCents`, `formatLKR`)
  at the boundaries where humans enter/read rupee amounts.
- **Quantities are REAL.** KG items can have decimal quantities (e.g. 2.5 kg).
- **`stock_qty` on `items` is a cache.** Every stock change inserts a row into
  `stock_movements` and updates `items.stock_qty` in the *same* transaction.
  Never update one without the other.
- **Bills snapshot item data.** `bill_items` stores `item_code`, `item_name`,
  `unit`, and `rate` as snapshots at sale time, so editing an item later never
  changes historical bills.
- **Billing math happens server-side.** The frontend may preview totals for
  UX, but the authoritative subtotal/discount/VAT/grand-total calculation is
  done in the backend when the bill is created.
- **Items are soft-deleted.** Set `is_active = 0`; never `DELETE` an item that
  might be referenced by stock movements or bills.
- **Express binds to `127.0.0.1` only.** This is a single-machine, offline
  app — never listen on `0.0.0.0` or expose the API beyond localhost.
- Use the `@` path alias for all frontend imports from `frontend/src`.

## Dev workflow

- `npm run dev:backend` — runs the backend standalone (nodemon +
  `backend/src/dev.js`) against `backend/dev.db`, port 5178. Use this with
  Postman/curl while building API routes, without launching Electron.
- `npm run dev` — full app: Vite dev server (port 5173) + Electron, wired
  together with `concurrently`/`wait-on`. Electron's main process starts its
  own backend instance against the real userData `pos.db`.
- `npm run rebuild` — rebuilds `better-sqlite3`'s native binding against
  Electron's Node ABI (`electron-rebuild -f -w better-sqlite3`). Run it after
  every `npm install`. In practice `better-sqlite3` v13+ ships prebuilt
  N-API binaries that are ABI-stable across plain Node and Electron, so this
  is more of a safety net than a strict requirement — but if you ever see a
  native module version-mismatch error, this is the fix.
- **Electron is pinned to `^44.4.4`, not the initially-planned v32.** On this
  dev machine, Electron 32.3.3 silently died before `app.whenReady()` fired
  (only logged `crashpad_client_win.cc(868)] not connected` and exited, no
  window, no crash report) — reproduced consistently with GPU/sandbox flags
  disabled too. Electron 44.4.4 starts cleanly. If `npm run dev` produces a
  window-less exit with that crashpad line, try bumping the Electron version
  before debugging further.
- `npm run build` — builds the frontend, then packages with electron-builder.

## Not built yet

Inventory CRUD, POS billing screen, receipt printing, and reports are all
placeholders. This is setup/scaffolding only.
