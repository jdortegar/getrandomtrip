# Deployment Guide

## Automated Production Deployment

This project is configured for automated database migrations and deployments.

### Vercel Deployment (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables in Vercel dashboard:**
   ```
   DATABASE_URL=your_production_postgresql_url
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Deploy**: Vercel will automatically run:
   - `npm install` (includes `prisma generate`)
   - `npm run deploy:prod` (runs migrations and builds)

### Manual Production Deployment

If deploying to other platforms:

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Build the application
npm run build

# Start the application
npm start
```

### Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes (development only)
npm run db:push

# Run migrations (production)
npm run db:migrate

# Open Prisma Studio
npm run db:studio

# Reset database (development only)
npm run db:reset
```

### Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-domain.com/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for development)

### Troubleshooting

- **Database connection issues**: Check `DATABASE_URL` format
- **OAuth errors**: Verify Google credentials and redirect URIs
- **Migration failures**: Ensure database has proper permissions
- **Build errors**: Check Node.js version compatibility
