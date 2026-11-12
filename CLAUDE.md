# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-page website for a barbershop: an Angular 22 frontend (`barbershop/`) talking to a Django 6 JSON API (`backend/`). Shop staff manage data (opening hours, services, appointments, barbers, contact messages) through the Django admin, themed with `django-unfold`. All user-facing text, model `verbose_name`s and API `message` strings are in **Slovak**, so keep new strings in Slovak too.

## Commands

`./run_dev.sh` opens two gnome-terminal windows, one running `ng serve` and one running `python manage.py runserver 8001`.

Frontend (run inside `barbershop/`):
- `ng serve` / `npm start`: dev server on http://localhost:4200
- `ng build`: production build (SSR) into `dist/barbershop/`; `npm run serve:ssr:barbershop` serves it on port 4000
- `ng test --watch=false`: Vitest unit tests (jsdom, `vi` is global). For a single spec, use `ng test --include src/app/services/booking.spec.ts`. Specs for components that make HTTP calls need `provideHttpClient()` + `provideHttpClientTesting()`
- Prettier config is in `.prettierrc` (printWidth 100, single quotes), though the existing code mostly uses double quotes without semicolons

Backend (run inside `backend/` with `.venv` activated):
- `pip install -r requirements.txt`
- `python manage.py runserver 8001`: the frontend expects port 8001 (set in `barbershop/src/environments/environment.ts`)
- `python manage.py makemigrations app && python manage.py migrate`
- `python manage.py test app --settings=core.settings_test`: backend tests (in `app/tests/`) on in-memory SQLite, so no PostgreSQL or `.env` is needed. A single test: `python manage.py test app.tests.test_scheduling.DayScheduleTests.test_closed_day_has_no_slots --settings=core.settings_test`

## Configuration

- `backend/core/settings.py` loads env vars from **`barbershop/.env`** (the frontend folder, not `backend/`). Required keys: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `POSTGRES_DB/USER/PASSWORD`, `ADMIN_URL` (the admin path; `core/urls.py` fails without it), `FRONT_END_DOMAIN_URL` (CORS origin), and the `EMAIL_*` settings used by the contact form.
- The database is PostgreSQL on `localhost:5433`, a non-default port.
- Uploaded media (barber photos, portfolio images) goes to `backend/media/` and is only served by Django when `DEBUG=True`.

## Architecture

**Backend**: one Django project (`core`) with one app (`app`). All endpoints are in `app/views.py` and routed under `/api/...` in `app/urls.py`. The views are plain function views that build `JsonResponse` dicts by hand; there are no DRF serializers or viewsets. Some use `@api_view`, others use `@csrf_exempt` with manual method checks. Every response has the shape `{ "success": bool, "message": str, ...payload }`, and the frontend relies on this envelope.
- `BarbershopConfig` is used as a singleton (`objects.first()`). Its `is_force_closed` flag overrides `OpeningHour` in `getStatus`.
- `OpeningHour.day_of_week` uses ISO numbering (1 = Monday) to match `isoweekday()`.
- `sendMessage` (contact form) always saves the `ContactMessage` first, then emails the shop **from `EMAIL_HOST_USER` with the customer as Reply-To** (never "From" the customer) using HTML-escaped content; an SMTP failure is logged, not returned as an error.
- **Admin** (`app/admin.py`, django-unfold): formatted price/duration columns via `app/formatting.py` (shared with model `__str__`), appointment status badges, date-range filter and cancel/restore actions, portfolio images edited inline on the barber page, and add-permission limits that keep `BarbershopConfig` a singleton and `OpeningHour` at 7 rows. `app/tests/test_admin.py` renders every admin page.
- `Service.price` is stored in **cents** (display it with the frontend `euro` pipe, durations with the `duration` pipe). `Service.description` is optional and shown in the price list.
- **Booking rules live in `app/scheduling.py`** (pure functions taking an optional `now`, so they are testable with a fixed clock): `get_day_schedule()` offers start times on a 15-minute grid inside that weekday's `OpeningHour`, requires the service to finish by closing time, marks starts overlapping active appointments (using each booked service's own duration) as unavailable, hides past times today and enforces a 90-day horizon. `ensure_slot_bookable()` applies the same rules when creating an appointment (409 when the slot was just taken), inside a transaction that row-locks the weekday's `OpeningHour` to serialise concurrent bookings. `next_opening()` powers the `next_open`/`next_open_day` fields of the status endpoint. `get-available-slots/` requires both `date` and `service_id`. Tests mock `django.utils.timezone.now` for API tests.

**Frontend**: a standalone-component Angular app using **zoneless change detection** (`provideZonelessChangeDetection`), with SSR/hydration enabled and every route prerendered (`app.routes.server.ts`). Because the app is zoneless, components that update state in async callbacks call `ChangeDetectorRef.detectChanges()` explicitly; prefer signals (`signal`/`computed`, signal `input()`s) for new state so no manual change detection is needed.
- There is only one route (`""` → `Home`). `home.html` stacks the page sections (banner, pricing, booking, profiles, contact-form, map), and `app.html` wraps them with the nav bar, footer, a global preloader and `<app-toasts />`. The banner component is the hero; its copy and optional background photo come from `SITE_CONFIG.hero`, and the logo from `SITE_CONFIG.logo` (null → text wordmark). Live data such as the open/closed status is fetched in `afterNextRender` and the HTTP transfer cache is disabled, so build-time API responses are never baked into the prerendered page.
- Navigation between sections goes through the `Scroll` service (`services/scroll.ts`) using the typed `SectionId` ids (`services`, `booking`, `barbers`, `contact`) that sit on the section elements. The fixed-nav offset comes from `scroll-padding-top` in `styles.scss`, so don't hardcode pixel offsets.
- User feedback goes through the `Toast` service (`toast.success/error/info`), never `alert()`.
- The booking section is a 3-step flow (service → date & time → details → confirmation). Its state and actions live in `BookingStore` (`booking/booking-store.ts`, provided by the `Booking` component); `service-step`, `datetime-step` and `details-step` are thin components that inject it. Dates travel as local `YYYY-MM-DD` strings via `booking/date-utils.ts` (never through UTC). The day picker disables weekdays that `get-opening-hours/` reports as closed.
- The services list is fetched once and cached (`Booking.getAvailableServices()` uses `shareReplay`) because both the price list and the booking form need it. Choosing a service in the price list stores it in the `BookingDraft` service, which the booking form reads to pre-select it.
- Reusable UI lives in `src/app/shared/`: `button[appButton]`/`a[appButton]` (inputs `variant` = primary|secondary|ghost, `size` = sm|md|lg, `block`) `<app-section-heading eyebrow title description align headingId>`, and the `euro`/`duration` pipes in `shared/pipes/`. Use these instead of styling buttons or section titles per component.
- `src/app/services/` has one injectable per API area. Services build URLs with `apiUrl("endpoint/")` from `src/app/config/api.ts`, which prefixes `environment.apiBaseUrl`. Shared request types are sometimes defined in the component and imported by the service with `import type` (e.g. `Customer` comes from `booking/booking.ts`).
- **Per-client branding:** everything that changes between barbershops (name, tagline, meta description, address, contacts, socials, payment methods, map embed URL) lives in `src/app/config/site.config.ts` (`SITE_CONFIG`). Components read from it; never hardcode business details in templates. `SiteMeta` (`services/site-meta.ts`) turns it into the `<title>`, `lang` and meta/OG tags at prerender time.
- The functional `loadingInterceptor` (registered with `provideHttpClient(withFetch(), withInterceptors([...]))`) counts in-flight requests in the `Loading` service, whose `is_loading()` signal drives the global preloader.
- **Styling:** the dark charcoal and brass design tokens (colors, type scale, spacing, radii, breakpoints, motion, z-index) live in `src/partials/_variables.scss`, and shared mixins (`container`, `card`, `button_primary`/`button_secondary`, `form_input`, `focus_ring`, `eyebrow`, `media_up`/`media_down`) live in `_mixins.scss`. `src` is a Sass load path, so component styles start with `@use "partials/variables" as *;` and `@use "partials/mixins" as *;`. Use `@use` (never `@import`), `sass:color` functions (never `darken`/`transparentize`) and tokens rather than raw values. Fonts are Playfair Display (headings) and Inter (body); icons come from the Font Awesome kit in `index.html`.
