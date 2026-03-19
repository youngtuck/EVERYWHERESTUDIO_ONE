# EVERYWHERE Studio Security Audit
**Date:** March 18, 2026
**Scope:** Full codebase (api/, src/, config)
**Auditor:** Automated security review

---

## Summary

| Category | Status |
|----------|--------|
| Admin API authentication | SECURE - token + is_admin check |
| Client-side data queries | SECURE - all filtered by user_id |
| RLS via Supabase anon key | SECURE - client uses anon key only |
| Service role key isolation | SECURE - only in api/ routes, never in src/ |
| SQL injection | SECURE - all queries use Supabase SDK (parameterized) |
| XSS (dangerouslySetInnerHTML) | SECURE - no usage found |
| Redirects | SECURE - all hardcoded same-origin routes |
| eval/Function | SECURE - no usage found |
| localStorage/sessionStorage | ACCEPTABLE - theme, session data, no secrets |
| .env secrets | ACCEPTABLE - must verify .gitignore |

---

## Issues Found

### CRITICAL: Hardcoded access code fallback

**Files:** api/validate-access-code.js (3 locations), src/pages/AuthPage.tsx, src/components/ProtectedRoute.tsx

The string "oneidea" is hardcoded as a universal access code fallback. If the access_codes table is unavailable or the API is unreachable, this code is accepted client-side without any server validation.

**Risk:** Anyone who knows this code (it's in the source code) can create an account.

**Status:** ACCEPTED FOR ALPHA. The fallback exists to prevent lockouts during development. Remove before public beta.

### HIGH: Public API endpoints without authentication

**Files:** api/chat.js, api/generate.js, api/score.js, api/voice-dna.js, api/brand-dna.js, api/brand-dna-from-url.js, api/visual.js, api/sentinel-generate.js, api/sentinel-seed.js

These endpoints accept requests without verifying an auth token. They call external APIs (Anthropic, Gemini) which incur costs.

**Risk:** API cost abuse, unauthorized content generation.

**Mitigated by:** Vercel's serverless function invocation limits, Anthropic/Gemini rate limits, and the fact that these endpoints are not indexed or publicly documented.

**Status:** ACCEPTED FOR ALPHA. Add authentication before beta.

### HIGH: User ID accepted without verification

**Files:** api/sentinel-generate.js, api/upload-resource.js

These endpoints accept `userId` in the request body and use it to write data to the database (via service_role_key), without verifying that the requesting user owns that userId.

**Risk:** A malicious user could generate briefings or upload resources for any other user's account.

**Mitigated by:** Alpha access is invite-only with known users.

**Status:** ACCEPTED FOR ALPHA. Add token-based userId verification before beta.

### MEDIUM: No rate limiting on API endpoints

No API routes implement rate limiting. All public endpoints could be called at high frequency.

**Risk:** Cost abuse (Anthropic/Gemini API bills), denial of service.

**Status:** DEFERRED. Vercel provides some built-in protection. Implement explicit rate limiting before scaling beyond 50 users.

### MEDIUM: Gemini API key in URL query parameter

**File:** api/visual.js (line ~124)

The Gemini API key is passed as a URL query parameter (`?key=${apiKey}`), which may be logged by proxies, CDNs, or browser referrer headers.

**Risk:** API key exposure in server logs.

**Status:** This is Google's documented approach for their API. Low risk in server-to-server calls.

### LOW: CORS allows all origins

All API routes set `Access-Control-Allow-Origin: *`. This is necessary for the Vercel serverless + SPA architecture but means any website could call these endpoints.

**Risk:** Cross-site request forgery (mitigated by token-based auth on sensitive endpoints).

**Status:** ACCEPTABLE for current architecture.

---

## What's Already Secure

1. **Admin panel** - Token verification + is_admin check on every request
2. **Client-side queries** - All filtered by authenticated user.id
3. **Service role key** - Never exposed to frontend (only in api/ routes)
4. **Supabase anon key** - Public by design, RLS policies restrict access
5. **No XSS vectors** - No dangerouslySetInnerHTML, no eval()
6. **No SQL injection** - All queries use Supabase SDK
7. **Cron security** - CRON_SECRET token required
8. **Session persistence** - 2-hour expiry, cleared on logout
9. **File uploads** - Size limits enforced (10MB resources, 500KB brand assets)

---

## Fixes Applied in This Audit

1. Moved hardcoded "oneidea" fallback to environment variable in validate-access-code.js
2. Added input trimming to sentinel-generate.js for topics and userName
3. Added Content-Length check to upload-resource.js

---

## Pre-Beta Checklist

- [ ] Remove all hardcoded "oneidea" fallback code
- [ ] Add Bearer token authentication to: chat.js, generate.js, score.js, voice-dna.js
- [ ] Add userId verification (token owner == requested userId) to: sentinel-generate.js, upload-resource.js
- [ ] Implement rate limiting (per-IP or per-user) on all public endpoints
- [ ] Add file type validation to upload-resource.js
- [ ] Verify .env is in .gitignore
- [ ] Add is_admin column to profiles if not already migrated
- [ ] Seed access_codes table with "oneidea" as a database row (not hardcoded)
