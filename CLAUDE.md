# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Single-page website for a barbershop: an Angular 22 frontend (`barbershop/`) talking to a Django 6 JSON API (`backend/`). Shop staff manage data (opening hours, services, appointments, barbers, contact messages) through the Django admin, themed with `django-unfold`. All user-facing text, model `verbose_name`s and API `message` strings are in **Slovak**, so keep new strings in Slovak too.

## Commands

`./run_dev.sh` opens two gnome-terminal windows, one running `ng serve` and one running `python manage.py runserver 8001`.

Frontend (run inside `barbershop/`):
- `ng serve` / `npm start`: dev server on http://localhost:4200
- `ng build`: production build (SSR) into `dist/barbershop/`; `npm run serve:ssr:barbershop` serves it on port 4000
- `ng test`: Vitest unit tests (jsdom). For a single spec, use `ng test --include src/app/services/booking.spec.ts`
- Prettier config is in `.prettierrc` (printWidth 100, single quotes), though the existing code mostly uses double quotes without semicolons

Backend (run inside `backend/` with `.venv` activated):
- `pip install -r requirements.txt`
- `python manage.py runserver 8001`: the frontend expects port 8001 (set in `barbershop/src/environments/environment.ts`)
- `python manage.py makemigrations app && python manage.py migrate`
- `python manage.py test app` (`app/tests.py` is currently empty)

## Configuration

- `backend/core/settings.py` loads env vars from **`barbershop/.env`** (the frontend folder, not `backend/`). Required keys: `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `POSTGRES_DB/USER/PASSWORD`, `ADMIN_URL` (the admin path; `core/urls.py` fails without it), `FRONT_END_DOMAIN_URL` (CORS origin), and the `EMAIL_*` settings used by the contact form.
- The database is PostgreSQL on `localhost:5433`, a non-default port.
- Uploaded media (barber photos, portfolio images) goes to `backend/media/` and is only served by Django when `DEBUG=True`.

## Architecture

**Backend**: one Django project (`core`) with one app (`app`). All endpoints are in `app/views.py` and routed under `/api/...` in `app/urls.py`. The views are plain function views that build `JsonResponse` dicts by hand; there are no DRF serializers or viewsets. Some use `@api_view`, others use `@csrf_exempt` with manual method checks. Every response has the shape `{ "success": bool, "message": str, ...payload }`, and the frontend relies on this envelope.
- `BarbershopConfig` is used as a singleton (`objects.first()`). Its `is_force_closed` flag overrides `OpeningHour` in `getStatus`.
- `OpeningHour.day_of_week` uses ISO numbering (1 = Monday) to match `isoweekday()`.
- `Service.price` is stored in **cents**.
- Booking slots are generated in `getAvailableSlots` from the hardcoded constants `START_HOUR`, `END_HOUR` and `SLOT_DURATION`. They ignore `OpeningHour` and the service duration, and a slot counts as taken when an active `Appointment` exists with the same `date` and `time_start`.

**Frontend**: a standalone-component Angular app using **zoneless change detection** (`provideZonelessChangeDetection`), with SSR/hydration enabled and every route prerendered (`app.routes.server.ts`). Because the app is zoneless, components that update state in async callbacks call `ChangeDetectorRef.detectChanges()` explicitly; keep doing this or use signals.
- There is only one route (`""` → `Home`). `home.html` stacks the page sections (banner, booking, contact-form, profiles, map), and `app.html` wraps them with the nav bar, footer, a canvas background and a global preloader.
- `src/app/services/` has one injectable per API area. Services build URLs with `apiUrl("endpoint/")` from `src/app/config/api.ts`, which prefixes `environment.apiBaseUrl`. Shared request types are sometimes defined in the component and imported by the service with `import type` (e.g. `Customer` comes from `booking/booking.ts`).
- **Per-client branding:** everything that changes between barbershops (name, tagline, meta description, address, contacts, socials, payment methods, map embed URL) lives in `src/app/config/site.config.ts` (`SITE_CONFIG`). Components read from it; never hardcode business details in templates. `SiteMeta` (`services/site-meta.ts`) turns it into the `<title>`, `lang` and meta/OG tags at prerender time.
- `LoadingInterceptor` (class-based and registered through `HTTP_INTERCEPTORS` + `withInterceptorsFromDi`) toggles the `Loading` service's `is_loading$` on every HTTP request, which drives the global preloader.
- **Styling:** the dark charcoal and brass design tokens (colors, type scale, spacing, radii, breakpoints, motion, z-index) live in `src/partials/_variables.scss`, and shared mixins (`container`, `card`, `button_primary`/`button_secondary`, `form_input`, `focus_ring`, `eyebrow`, `media_up`/`media_down`) live in `_mixins.scss`. `src` is a Sass load path, so component styles start with `@use "partials/variables" as *;` and `@use "partials/mixins" as *;`. Use `@use` (never `@import`), `sass:color` functions (never `darken`/`transparentize`) and tokens rather than raw values. Fonts are Playfair Display (headings) and Inter (body); icons come from the Font Awesome kit in `index.html`.
