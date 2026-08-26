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
