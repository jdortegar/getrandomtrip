# Upload Service

**Status**: Complete
**Priority**: Low

## Purpose

Centralized file upload service for user avatars, experience images, and blog media. Backed by Netlify Blobs with per-feature store namespacing. Auth is required for all mutating operations and ownership is checked on delete.

## What's Implemented

- `POST /api/upload`: auth required, 10 MB limit, image MIME types only, stored in Netlify Blobs with per-feature store namespacing
- `GET /api/upload`: serves blobs with cache headers and legacy store fallback
- `DELETE /api/upload`: auth required, ownership check before deletion

## Gaps

- [ ] No video upload support — experience and blog content that requires video has no upload path
- [ ] No EXIF stripping or image resizing — uploaded images are stored as-is, which may expose location metadata or result in oversized files
- [ ] Netlify Blobs dependency with no local dev fallback — running locally without `NETLIFY` credentials fails silently or errors
- [ ] No admin UI to audit or delete uploads

## Out of Scope

- CDN distribution of uploaded assets beyond Netlify's default delivery
- Virus or malware scanning of uploads
