# Authentication Frontend

A Next.js 14 authentication frontend that communicates with a backend API.

## Features

- ✅ User Registration with Email Verification
- ✅ User Login
- ✅ Password Recovery Flow
- ✅ Password Reset
- ✅ Protected Dashboard
- ✅ Logout Functionality
- ✅ HttpOnly Cookie-based Authentication

## Setup

1. Install dependencies:

```bash
pnpm i --frozen-lockfile
```

2. Create `.env.local` file:

```bash
cp .env.example .env.local
```

3. Configure environment variables:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Optional: same-origin proxy (recommended for Safari)
# FRONTEND_PROXY_TARGET=http://localhost:3000
```

4. Start the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:3001`

## Pages

- `/` - Home page with navigation links
- `/register` - User registration
- `/login` - User login
- `/login` - User login (includes Google OAuth button)
- `/forgot-password` - Request password reset
- `/reset-password` - Reset password with token
- `/dashboard` - Protected user dashboard
- `/logout` - Logout and redirect to login

## Security Features

- HttpOnly cookies for authentication
- No client-side token storage
- Credentials included in all API requests
- Protected routes with automatic redirect
- Non-enumerating error messages

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Fetch API

## Google OAuth Example

```ts
const response = await api.getGoogleAuthUrl();
if (response.success && response.data?.url) {
  window.location.href = response.data.url;
}
```

## Important Notes

- Frontend NEVER interacts with Supabase directly
- All authentication is handled by the backend API
- Always use `credentials: 'include'` in fetch requests
- Auth state is determined by API responses only

## Safari & Cross-Site Cookies

Safari often blocks third-party cookies. If your frontend and backend are on **different sites**, HttpOnly auth cookies may not be set.

**Recommended fix:** use same-origin proxying by setting `FRONTEND_PROXY_TARGET` and calling `/auth/*` relative routes. This keeps cookies first-party.

When using the proxy, set `NEXT_PUBLIC_API_BASE_URL` to an empty string (or omit it) so the client calls relative paths.

If you must stay cross-site, configure backend cookies with `SameSite=None` + `Secure`, but Safari may still block them.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.
