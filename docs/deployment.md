# Deployment Guide for Randomtrip

This document outlines the steps to deploy the Randomtrip application to various platforms.

## Table of Contents
1.  [Environment Variables Setup](#environment-variables-setup)
2.  [Deployment to Vercel (Frontend)](#deployment-to-vercel-frontend)
3.  [Deployment to Azure (Backend)](#deployment-to-azure-backend)
4.  [Monitoring](#monitoring)
5.  [Rollback Procedures](#rollback-procedures)

---

## 1. Environment Variables Setup

Ensure you have the following environment variables configured for both your frontend and backend services. These should be set securely in your deployment environment (e.g., Vercel project settings, Azure App Service configuration).

### Project Root `.env.example` (for local development reference)

```
DATABASE_URL="file:./dev.db"
MERCADO_PAGO_ACCESS_TOKEN="your_mercadopago_access_token"
NEXT_PUBLIC_BACKEND_API_URL="http://localhost:3001"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key"
```

### Backend (`backend/.env`)

These variables are used by the Node.js backend.

-   `DATABASE_URL`: Connection string for your PostgreSQL or SQLite database.
    -   Example (PostgreSQL): `postgresql://user:password@host:port/database`
    -   Example (SQLite - for local dev): `file:./dev.db`
-   `MERCADOPAGO_ACCESS_TOKEN`: Your Mercado Pago access token for API calls.
-   `FRONTEND_URL`: The URL of your deployed frontend application (e.g., `https://your-frontend.vercel.app`). Used for `back_urls` in Mercado Pago preferences.
-   `BACKEND_URL`: The URL of your deployed backend API (e.g., `https://your-backend.azurewebsites.net`). Used for Mercado Pago webhook `notification_url`.
-   `PORT`: The port the backend server should listen on (e.g., `3001`).

### Frontend (`frontend/.env.local` or Vercel Environment Variables)

These variables are used by the Next.js frontend.

-   `NEXT_PUBLIC_BACKEND_API_URL`: The public URL of your deployed backend API (e.g., `https://your-backend.azurewebsites.net`).
-   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Your Google Maps API key for client-side map functionalities.

---

## 2. Deployment to Vercel (Frontend)

Vercel is recommended for deploying the Next.js frontend due to its seamless integration with Next.js.

1.  **Connect Repository**: Log in to Vercel, import your Git repository (e.g., GitHub, GitLab, Bitbucket).
2.  **Project Configuration**:
    *   **Root Directory**: Set the root directory to `frontend/`.
    *   **Build Command**: Vercel automatically detects Next.js, so `next build` should be default.
    *   **Output Directory**: `build` (default for Next.js).
3.  **Environment Variables**: Add all `NEXT_PUBLIC_` environment variables from the [Frontend section](#frontend-frontendenvlocal-or-vercel-environment-variables) to your Vercel project settings.
4.  **Deploy**: Vercel will automatically deploy on every push to your configured branch (e.g., `main`).

---

## 3. Deployment to Azure (Backend)

Azure App Service is a good option for deploying the Node.js backend.

1.  **Create App Service**: In the Azure portal, create a new App Service.
    *   **Runtime Stack**: Node.js (choose the appropriate version).
    *   **Operating System**: Linux.
    *   **Region**: Choose a region close to your users and database.
2.  **Deployment Method**:
    *   **GitHub Actions (Recommended)**: Configure continuous deployment from your Git repository. Azure will generate a workflow file (`.github/workflows/main_your-app-name.yml`) that builds and deploys your backend.
        *   Ensure the workflow specifies the `backend/` directory for deployment. You might need to modify the generated workflow to navigate into the `backend` directory before running `npm install` and `npm run build`.
        *   Example snippet for `ci.yml` (adjust as needed):
            ```yaml
            - name: Install dependencies
              run: npm install
              working-directory: backend

            - name: Build
              run: npm run build
              working-directory: backend
            ```
    *   **Zip Deploy / FTP**: Manually deploy your `dist` folder (after `npm run build` in `backend/`).
3.  **Configuration**:
    *   **Application Settings**: Add all environment variables from the [Backend section](#backend-backendenv) as Application Settings in your App Service.
    *   **Connection Strings**: If using a managed database service (e.g., Azure Database for PostgreSQL), configure its connection string here.
4.  **Database Migration**: After deployment, you'll need to run Prisma migrations on your production database. This can be done via SSH into the App Service instance or as part of your CI/CD pipeline.
    ```bash
    npx prisma migrate deploy
    ```
5.  **Start Command**: Ensure your App Service is configured to start your Node.js application correctly. For example, `node dist/index.js` (assuming your main entry point is `index.ts` and it compiles to `dist/index.js`).

---

## 4. Monitoring

Implement monitoring to ensure the health and performance of your application.

-   **Frontend (Vercel)**:
    *   Vercel provides built-in analytics and logs.
    *   Integrate with a third-party service like Sentry for error tracking.
-   **Backend (Azure App Service)**:
    *   **Application Insights**: Enable Application Insights for detailed performance monitoring, logging, and error tracking.
    *   **Azure Monitor**: Set up alerts for CPU usage, memory, and HTTP errors.
    *   **Log Streaming**: Monitor real-time logs from your App Service for debugging.
-   **Database**: Monitor database performance, connection usage, and query times through your database provider's tools.

---

## 5. Rollback Procedures

In case of issues after a deployment, you should have a clear rollback strategy.

-   **Frontend (Vercel)**:
    *   Vercel keeps a history of all deployments. You can easily revert to a previous successful deployment directly from the Vercel dashboard.
-   **Backend (Azure App Service)**:
    *   **Deployment Slots**: Use deployment slots (e.g., a "staging" slot and a "production" slot). Deploy to staging first, test, and then swap with production. If issues arise, you can quickly swap back to the previous production slot.
    *   **Git Revert**: If using Git-based deployment, revert the problematic commit in your repository and push the change. This will trigger a new deployment of the previous working version.
-   **Database Rollback**:
    *   **Prisma Migrate Rollback**: Prisma has `prisma migrate resolve --rolled-back <migration_name>` but generally, database rollbacks are complex and should be handled with caution.
    *   **Database Backups**: Ensure regular database backups are in place. In a critical situation, you might need to restore from a recent backup. This should be a last resort as it can lead to data loss.
    *   **Idempotent Migrations**: Design your database migrations to be idempotent where possible, making them safe to re-run.
