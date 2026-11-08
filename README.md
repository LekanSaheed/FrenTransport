# Obere Transport — Frontend

Next.js 16 (App Router) + Tailwind v4. Talks to the API in `../Backend`.

## Running locally

```bash
cp .env.example .env.local   # BACKEND_URL=http://localhost:4000
npm install
npm run dev                  # http://localhost:3000  (admin: /admin)
```

Start the backend first (see `../Backend/README.md`) and create an admin with
`npm run admin:create` there. The frontend holds no secrets: payment and email keys live
only on the backend.

## How the frontend reaches the API

The browser only ever calls this app: `/api/*` is forwarded to the Express backend by a
rewrite in `next.config.ts` (`BACKEND_URL`). Session cookies are therefore first-party on
any hosting setup, and no CORS configuration is needed.

`proxy.ts` (Next 16's replacement for `middleware.ts`) runs before every `/api`, `/admin`
and `/account` request:
- it forwards the customer's real IP to the backend in `x-obere-client-ip`, signed with
  `API_PROXY_SECRET` (same value on both sides), and strips any copy the browser sent —
  without this every customer would share one rate-limit bucket;
- it redirects visitors without a session cookie away from `/admin/*` and `/account/*`.
  That is only a convenience: the backend checks the session **and role** on every call.

**Deploying:** set `BACKEND_URL` at **build time** (rewrite destinations are baked into
the build) and `API_PROXY_SECRET` at runtime. On Vercel/Render the platform supplies
`X-Forwarded-For`; behind your own Nginx, make sure it sets it.

## Layout

```
app/
  (site)/      public website and customer account (header, footer)
  admin/
    login/     staff sign-in (no admin sign-up exists)
    (panel)/   dashboard pages, wrapped in components/admin/AdminShell
    account/   customer dashboard (inside the public site's layout)
    login/ register/ forgot-password/ reset-password/ verify-email/
```

Access: `components/admin/access.tsx` gives `useCan()` / `<Can perm>` (from the signed-in staff member's permissions) to hide pages and buttons a role can't use; the sidebar hides pages and a page outside the role shows "No access". The backend enforces every permission regardless.

Image handling lives in `components/media/`, built once and reused:

| Component | Used by |
|---|---|
| `MediaLibrary` (search + `MediaDropzone` + `MediaGrid` + pagination) | Gallery page (`mode="manage"`) and `MediaPicker` (`mode="pick"`) |
| `MediaPicker` | Floating gallery: pick or upload an image, returns its URL |
| `ImageField` | Form control with preview that opens `MediaPicker` (vehicle types; reuse for any image field) |
| `SmartImage` | `next/image` that asks Cloudinary for resized copies; `/public` files use Next's optimiser |

Uploads use `useMediaUpload()` / `uploadImage()` in `libs/media.ts` (sign → upload to Cloudinary → register).

## Pages

| Route | Purpose |
|---|---|
| `/book` | Search trips by route, date and passengers |
| `/book/[tripId]` | Seat map → passenger & contact details → review → Paystack |
| `/payment/callback` | Paystack returns here; the backend verifies the payment before anything is confirmed |
| `/hire/car` | Car hire — instant price per day, then payment |
| `/hire/bus` | Bus hire — request a quotation |
| `/booking-status` | Status by reference + email |
| `/manage` | Verify by emailed code (or email link), then pay, accept/decline a quote, cancel or request a change |

## Customer accounts

Accounts are optional — guest booking, Booking Status and Manage Booking work as before.

| Route | What it does |
|---|---|
| `/register`, `/login` | Create an account / sign in (returns to `?next=` — only same-site, never `/admin`) |
| `/forgot-password`, `/reset-password` | Email a single-use reset link; resetting signs out every device |
| `/verify-email` | Confirms the email from the welcome link; earlier guest bookings made with that email are added to the account |
| `/account` | Next trip, counts, recent bookings, confirm-email reminder |
| `/account/bookings` | Upcoming / past / all; "add a booking made with another email" (proved with the emailed code) |
| `/account/bookings/[reference]` | Same panel as Manage Booking (pay, accept/decline quote, request a change, cancel) — authorised by the session, no code |
| `/account/profile` | Name, phone, change password |

Signed-in customers get their contact details pre-filled at checkout, and new bookings
are linked to their account automatically. The header shows **Sign in** / **My account**.
Tokens from email links (verify, reset) are removed from the address bar as soon as the
page reads them.

## Admin dashboard (`/admin`)

| Page | What it does |
|---|---|
| Overview | Live totals, revenue (gross/refunded/net), pending payments, next 24 h, 30-day charts, recent bookings and activity |
| Bookings | Search/filter all bookings; detail page with quotes, payments, change requests, activity, and actions (quote, reject, record offline payment with evidence, manual refund, edit with reason, cancel, decide cancellation requests) |
| Hire requests | Car and bus requests, defaulting to those awaiting a quote |
| Timetables | Repeating plans per vehicle with a live check (each trip starts where the last ended, turnaround, loop closes); pause/resume/delete; Schedule issues tab (location conflicts, timetable gaps, routes without departures) |
| Trips | Upcoming / departed / cancelled views; one-off scheduling (route, vehicle, dates, times, fare; skipped slots explained); trip page with seat map (block/release seats), passenger manifest, reschedule/change vehicle/fare, cancel (refunds everyone) or delete (only if never booked) |
| Vehicles | Fleet (add/edit, status, notes, upcoming trips) and vehicle types (image picked from the gallery, hire pricing, visual seat-layout builder with templates, Duplicate to change a locked layout) |
| Routes & terminals | The 23 one-way routes: activate/deactivate, duration, default fare; add routes; add/edit terminals (state and city chosen from the Settings list) |
| Customers | Search accounts, booking history and spend; disable/re-enable (signs them out everywhere) |
| Payments | Read-only transactions with totals; payment page with evidence, booking and refunds (retry failed refunds) |
| Activity log | Who did what, when, from which IP |
| Gallery | Upload (drag and drop, several at once), search, rename, copy link, delete (blocked while in use). The same library opens as a floating picker from image fields, where you can also upload |
| Staff | Owners only: invite staff by email with a role, change roles, disable, resend invitations; a table of what each role can do. Invitees set their password at `/admin/accept-invite` |
| Settings | General: booking and cancellation rules, hire notice periods, contact details, staff alert email; payment/email configuration shown read-only. States & cities: the cities terminals can be placed in, per state |

## Structure

- `libs/api.ts` — typed API client (`{ success, data | error }` envelope, `ApiError`)
- `libs/types.ts`, `libs/format.ts` — API types; naira and WAT date formatting
- `libs/payment.ts` — starts a Paystack checkout
- `components/ui/` — form controls, alerts, badges, cards (built on the existing design tokens)
- `components/booking/` — the booking flows
- `libs/customer.ts`, `components/account/` — customer session store (`useCustomer`), account API, auth forms and account pages
- `libs/admin.ts`, `components/admin/` — admin API client, data hook, shell and building blocks (tables, filters, modal, stat cards, SVG bar chart)

Manage Booking tokens are short-lived and booking-scoped. They are kept in
`sessionStorage`, and a token arriving via an email link is removed from the URL straight away.
