# ShopLedger

## Stack

Node.js with CommonJS, Express 4, and body-parser for JSON requests. Express serves plain HTML, CSS, and JavaScript from `public/`. The app persists its data in `data/db.json`.

## Module map

- `routes/customers.js` lists Khata accounts and settlements and records payments.
- `routes/orders.js` lists, retrieves, places, and cancels orders.
- `routes/products.js` serves the product catalog and active coupons.
- `routes/reports.js` serves dashboard and GST reconciliation reports, pricing previews, and admin export.
- `lib/coupons.js` normalizes coupon codes, validates eligibility, and calculates discounts.
- `lib/dates.js` formats dates, normalizes date keys, and calculates fiscal-year labels.
- `lib/inventory.js` looks up products, checks and adjusts stock or reservations, and summarizes inventory.
- `lib/invoice.js` recomputes invoice figures and renders printable HTML.
- `lib/ledger.js` computes Khata balances, charges and reverses order debits, and records settlements.
- `lib/orders.js` adds, finds, filters, and cancels order records.
- `lib/pricing.js` calculates checkout subtotals, discounts, per-line GST, and totals.
- `lib/reports.js` builds dashboard summaries and compares recorded sales with computed invoices.
- `lib/store.js` reads and writes the JSON database and maintains the audit log.
- `lib/tax.js` resolves GST rates and splits GST into CGST and SGST.

## Commands

- Start the app with `node server.js` (`npm start` runs the same command).
- Run tests with `node --test`. The `npm test` script is a placeholder that exits with failure.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests must use in-memory data and must never read or write `data/db.json`.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

The printable invoice total and GST breakdown do not match what the customer was billed. Checkout calculates GST from each line's HSN after allocating the coupon discount. The invoice recalculates GST on undiscounted lines using a saved rate when truthy or the configured fallback.

Allowed files for the fix are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
