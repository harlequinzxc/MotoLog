# MotoLog

A mobile-first Progressive Web App for tracking fuel, mileage, costs, and the
vehicles you love to ride.

## Development

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## PWA foundation

The app includes a standalone portrait web manifest, iOS-compatible PWA meta
tags, install icons, and a persisted accent-theme provider. The initial app
version is defined in `lib/constants.ts`.

## Installing on Chrome for Android

On a secure deployment such as Vercel, MotoLog registers an app-shell service
worker and meets Chrome's manifest requirements. When Chrome emits its
installation event, the app shows an **Install MotoLog** prompt; tapping it opens
Chrome's native installation dialog.

## CSV templates

The Settings screen can download a **demo CSV template** containing a Yamaha
MT-15 and sample fill-ups. It uses a simple settings row followed by vehicle and
fill-up rows, with no internal IDs or timestamps. Edit the settings row first;
its currency and unit fields determine how vehicle and fill-up values are read
when the CSV is imported.
