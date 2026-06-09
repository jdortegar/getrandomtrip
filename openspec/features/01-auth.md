# Auth & User Management

**Status**: Partial
**Priority**: High

## Purpose

Handles user registration, authentication, and account management for all roles (CLIENT, TRIPPER, ADMIN). Users sign up with email/password credentials, manage their profile across six account tabs, and can upload an avatar. Role-aware routing sends users to the appropriate dashboard after login.

## What's Implemented

- Login and signup via credentials with NextAuth session management
- Welcome email sent on first sign-in
- Account page with 6 tabs: summary, personal data, travel docs, preferences, payments, security
- Personal data editable via `/api/user/update`
- Preferences editable via `/api/user/preferences`
- Password change via `/api/user/password`
- Avatar upload via `/api/upload` + `/api/user/update`
- Locale preference persisted via `/api/user/locale`
- Role-aware tripper sidebar links from the account page

## Gaps

- [ ] Duplicate register routes — `/api/auth/register` and `/api/auth/signup` both exist; one is dead code and should be removed
- [ ] No password reset / forgot-password flow — no API route, no email template, no UI
- [ ] No email verification after registration
- [ ] "Travel Documents" tab is hardcoded "Coming Soon" — no passport or ID storage implemented
- [ ] "Payment Methods" tab is hardcoded "Coming Soon" — no saved card management
- [ ] No Google or GitHub OAuth — only email/password credentials supported
- [ ] No account deletion flow

## Out of Scope

- Multi-factor authentication (TOTP, SMS)
- SSO / enterprise identity providers
- Session device management
