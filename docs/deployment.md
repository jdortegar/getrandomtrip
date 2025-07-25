# Deployment and Rollback Runbook

This document outlines the procedures for deploying and rolling back the Randomtrip web application to staging and production environments.

## Table of Contents
1.  [Deployment Prerequisites](#deployment-prerequisites)
2.  [Environment Variables](#environment-variables)
3.  [Staging Deployment](#staging-deployment)
4.  [Production Deployment](#production-deployment)
5.  [Monitoring Setup](#monitoring-setup)
6.  [Emergency Rollback Procedure](#emergency-rollback-procedure)

## 1. Deployment Prerequisites

Before deploying, ensure the following:
*   **Git Repository:** The latest code is pushed to the main branch (for production) or a feature branch (for staging).
*   **Vercel Account:** A Vercel account is set up and linked to the Git repository.
*   **Environment Variables:** All required environment variables are configured in Vercel for the respective environment.
*   **Build Tools:** Node.js and npm/yarn are installed locally if manual builds are required.

## 2. Environment Variables

The following environment variables are required for the application to function correctly. These should be configured in Vercel's project settings for each environment (Staging and Production).

### Frontend (Next.js)
*   `NEXT_PUBLIC_BACKEND_API_URL`: URL of the backend API (e.g., `https://api.randomtrip.com` or `https://staging-api.randomtrip.com`).
*   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API Key with Places API enabled.

### Backend (Node.js/Express)
*   `DATABASE_URL`: Connection string for the PostgreSQL database.
*   `MERCADOPAGO_ACCESS_TOKEN`: Mercado Pago access token for payment processing.
*   `FRONTEND_URL`: URL of the frontend application (e.g., `https://randomtrip.com` or `https://staging.randomtrip.com`).
*   `BACKEND_URL`: URL of the backend application (e.g., `https://api.randomtrip.com` or `https://staging-api.randomtrip.com`).
*   `JWT_SECRET`: Secret key for JWT token generation and verification.

## 3. Staging Deployment

Staging deployments are typically triggered automatically on pushes to specific feature branches or a `develop` branch.

1.  **Push Code:** Push your changes to the designated feature branch (e.g., `feat/new-feature`) or `develop` branch.
2.  **Vercel Automatic Deployment:** Vercel will automatically detect the new commit and initiate a build and deployment to the staging environment.
3.  **Verify Deployment:**
    *   Access the staging URL provided by Vercel.
    *   Perform smoke tests to ensure core functionalities are working as expected.
    *   Check Vercel deployment logs for any errors or warnings.

## 4. Production Deployment

Production deployments are typically triggered manually from the `main` branch after thorough testing in staging.

1.  **Merge to Main:** Ensure all desired features and bug fixes are merged into the `main` branch.
2.  **Vercel Manual Deployment (or Git Push):**
    *   **Option A (Recommended - Vercel Dashboard):** Go to your Vercel project dashboard, select the `main` branch, and trigger a new production deployment.
    *   **Option B (Git Push):** If Vercel is configured for automatic production deployments on `main` branch pushes, simply push the `main` branch to your remote repository.
3.  **Verify Deployment:**
    *   Access the production URL (e.g., `https://randomtrip.com`).
    *   Perform critical smoke tests (e.g., user login, payment flow, core features).
    *   Monitor application performance and error logs immediately after deployment.

## 5. Monitoring Setup

Effective monitoring is crucial for identifying and resolving issues quickly.

*   **Vercel Analytics:** Utilize Vercel's built-in analytics for frontend performance and traffic monitoring.
*   **Backend Logging:** Implement robust logging in the backend (e.g., using Winston or Pino) and integrate with a log management service (e.g., Datadog, ELK Stack, CloudWatch Logs).
*   **Error Tracking:** Use an error tracking service (e.g., Sentry, Bugsnag) to capture and report application errors in real-time.
*   **Uptime Monitoring:** Set up external uptime monitoring (e.g., UptimeRobot, Pingdom) to ensure the application is always accessible.
*   **Performance Monitoring:** Use APM tools (e.g., New Relic, Datadog APM) for detailed performance insights into the backend.

## 6. Emergency Rollback Procedure

In case of critical issues in production, follow these steps for an emergency rollback.

1.  **Identify Stable Deployment:** In the Vercel dashboard, navigate to your project's deployments. Identify the last known stable production deployment.
2.  **Initiate Rollback:** Click the "Rollback" or "Redeploy" button next to the stable deployment. Vercel will redeploy the selected version.
3.  **Verify Rollback:**
    *   Access the production URL and confirm that the application has reverted to the previous stable state.
    *   Check monitoring dashboards for a reduction in errors and a return to normal performance.
4.  **Post-Rollback Analysis:**
    *   Investigate the root cause of the issue that necessitated the rollback.
    *   Create a post-mortem document detailing the incident, its impact, resolution, and preventative measures.
    *   Implement a fix in a new branch, test thoroughly in staging, and then redeploy to production.