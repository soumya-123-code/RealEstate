# Suretreaven Real Estate Application — Engineering Audit

Date: 2026-08-16

## Scope reviewed

- Express/Prisma API routes, controllers, middleware, authentication, OTP, uploads, Socket.IO, WebRTC signaling, bookings, notifications and CMS.
- Vite/React frontend routes, active API calls, authentication, chat, booking, profile, admin and agent flows.
- Production configuration, branding, API base URLs, Socket.IO configuration, and responsive theme tokens.
- Static JavaScript syntax for every API `.js` source file.

## Important fixes applied

### Authentication & security
- Fixed JWT expiry: the JWT was previously configured with a millisecond value as `expiresIn`, which made the token effectively far longer than the intended 7 days. It now uses `7d` while the cookie remains 7 days.
- Prevented ordinary authenticated users from reading other users' profiles.
- Prevented ordinary users from mass-assigning sensitive fields such as role, permissions, admin access, and account status through the profile update endpoint.
- Added avatar upload endpoint with authenticated ownership.
- Added Socket.IO JWT authentication instead of trusting a client-supplied user ID.
- Added proxy trust configuration for production rate limiting behind reverse proxies.
- Added stricter validation for property and booking status changes.
- Added validation/whitelisting for admin property create/update payloads.
- Added validation for call-log participants and chat membership.
- Rate-limited the login preview endpoint.
- Removed development OTP disclosure from production API responses.
- Production email OTP delivery now fails explicitly if SMTP is unavailable instead of silently claiming delivery.
- Production phone OTP now requires a real SMS provider rather than returning the OTP in the API response.
- Added `.env` and `.env.*` to `.gitignore` while retaining `.env.example`.

### API/frontend integration
- Fixed production API default from `http://localhost:8800/api` to same-origin `/api`.
- Fixed production Socket.IO default from `http://localhost:8800` to the current origin, with `VITE_SOCKET_URL` override support.
- Fixed property WhatsApp endpoint mismatch.
- Added token-booking aliases using the existing Booking model; no new database table was introduced.
- Added user booking-history endpoint alias.
- Added message/chat read endpoint used by chat UI.
- Added profile avatar upload endpoint.
- Fixed phone normalization in OTP verification/login flows.
- Fixed property filter range handling and MySQL-compatible Prisma text filters.
- Added property pagination bounds and query validation.
- Fixed property image/amenity/feature submission to send JSON arrays rather than JSON strings.
- Added real-time booking status updates over Socket.IO.

### Chat & WebRTC
- Corrected frontend Socket.IO WebRTC event names to match the backend.
- Corrected incoming-call payload handling.
- Corrected ICE candidate, answer, reject and end-call payload names.
- Added authenticated socket handshake.
- Added safer call-log authorization.
- Preserved existing REST message persistence and Socket.IO live delivery.

### Routing & UX
- Added missing `/admin/login` route.
- Added missing `/agent/login` route.
- Added missing `/bookings` route.
- Updated booking UI to use the actual Prisma Booking status model instead of an incompatible TokenBooking status model.
- Rebranded active application defaults and API metadata to Suretreaven.
- Updated the primary visual theme toward a classic premium real-estate palette: deep navy, warm gold, ivory/stone neutrals, restrained shadows and serif display typography.

## Issues found that were not safe to pretend were fully solved

1. **Production SMS provider**
   - The repository contains a dummy phone OTP implementation. It is intentionally blocked in production after this audit.
   - Configure a real SMS provider before enabling phone OTP in production.

2. **Production runtime verification**
   - The uploaded API dependency tree was incomplete in the review environment and package installation could not complete from the available package cache/network.
   - Therefore a full live Prisma/database/API integration test could not be truthfully claimed from this environment.
   - Every API JavaScript source file passed `node --check`.

3. **Database-dependent validation**
   - A live MySQL/MariaDB connection and Prisma migration execution were not available in the review environment.
   - Run migrations and perform the smoke-test checklist below against a staging database before production release.

4. **Legacy/dead parallel UI**
   - The repository contains an older Next.js/TypeScript-style UI tree alongside the active Vite/React application. The active entry point is `src/main.jsx` -> `src/App.jsx`.
   - The legacy tree contains mock-data API clients and should be removed in a later cleanup or migrated deliberately; it is not part of the active Vite route graph.

5. **WebRTC infrastructure**
   - WebRTC uses public STUN servers only. For reliable calls across restrictive NAT/firewalls, add a TURN server.

## Staging smoke test

1. Install API dependencies and run Prisma generate/migrations.
2. Configure production-like SMTP and a real SMS provider.
3. Start API and verify:
   - `/`
   - `/api/health`
   - `/api/properties`
   - `/api/properties/filters`
4. Register a new user using email OTP.
5. Verify email OTP.
6. Login with email OTP.
7. Login with phone OTP after SMS provider configuration.
8. Verify ordinary users cannot access `/api/users` or another user's profile.
9. Verify admin/staff authorization.
10. Create/edit/delete a property.
11. Upload property images.
12. Open a property and generate WhatsApp booking.
13. Verify booking appears in My Bookings.
14. Change booking status in admin and verify customer receives the Socket.IO update.
15. Send chat messages in both directions.
16. Verify chat read/unread state.
17. Verify audio/video call signaling with two authenticated users.
18. Upload/update a profile avatar.
19. Verify CMS pages and admin content endpoints.
20. Test mobile widths around 320px, 375px, 768px and desktop widths.
21. Test refresh/deep-link routing for `/property/:id`, `/admin`, `/admin/login`, `/agent/login`, and `/bookings`.
22. Run frontend `npm run build` and `npm run lint` in the deployment environment.

## Production security actions

- Rotate any database password, JWT secret, SMTP password, WhatsApp credentials, or other secret that was ever stored in the uploaded `.env`.
- Do not commit `.env`.
- Use HTTPS for the website and API.
- Configure a real SMS provider.
- Configure TURN for production WebRTC.
- Restrict CORS to the real frontend origin(s).
- Run Prisma migrations against a backup/staging database first.
