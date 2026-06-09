# GetRandomTrip — Feature Spec Index

Last updated: 2026-06-08

| Feature | Status | Priority | Open Gaps | Spec |
|---|---|---|---|---|
| [Auth & User Management](01-auth.md) | Partial | High | 7 | [01-auth.md](01-auth.md) |
| [Trip Booking / Client Journey](02-trip-booking.md) | Partial | High | 5 | [02-trip-booking.md](02-trip-booking.md) |
| [Client Dashboard](03-client-dashboard.md) | Partial | High | 5 | [03-client-dashboard.md](03-client-dashboard.md) |
| [Payments](09-payments.md) | Partial | High | 4 | [09-payments.md](09-payments.md) |
| [Experience Discovery (Public)](05-experience-catalog.md) | Partial | Medium | 2 | [05-experience-catalog.md](05-experience-catalog.md) |
| [Tripper OS](04-tripper-os.md) | Partial | Medium | 5 | [04-tripper-os.md](04-tripper-os.md) |
| [Transactional Emails](12-transactional-emails.md) | Partial | Medium | 7 | [12-transactional-emails.md](12-transactional-emails.md) |
| [Admin Dashboard](08-admin-dashboard.md) | Partial | Medium | 6 | [08-admin-dashboard.md](08-admin-dashboard.md) |
| [In-App Notifications](11-notifications.md) | Partial | Medium | 5 | [11-notifications.md](11-notifications.md) |
| [Blog](10-blog.md) | Partial | Medium | 6 | [10-blog.md](10-blog.md) |
| [XSED / Drops](07-xsed-drops.md) | Partial | Medium | 4 | [07-xsed-drops.md](07-xsed-drops.md) |
| [Tripper Public Profiles](06-tripper-profiles.md) | Partial | Medium | 4 | [06-tripper-profiles.md](06-tripper-profiles.md) |
| [Waitlist & Newsletter](13-waitlist-newsletter.md) | Partial | Low | 6 | [13-waitlist-newsletter.md](13-waitlist-newsletter.md) |
| [Upload Service](14-upload.md) | Complete | Low | 4 | [14-upload.md](14-upload.md) |
| [Geo / Maps](15-geo-maps.md) | Complete | Low | 4 | [15-geo-maps.md](15-geo-maps.md) |

## Summary

- **Total features**: 15
- **Complete**: 2
- **Partial**: 13
- **Stub / Missing**: 0
- **Total open gaps**: 74

## High-impact gaps at a glance

The following gaps block core product loops and should be prioritized before any polish work:

1. **Password reset flow** (Auth) — no API, no email template, no UI
2. **`/api/bookings` stub** (Trip Booking) — returns a fake UUID; the booking core is unimplemented
3. **Client review submission** (Client Dashboard) — "Leave Review" links to a non-existent route
4. **Refund flow** (Payments) — no Stripe refund API call and no admin action
