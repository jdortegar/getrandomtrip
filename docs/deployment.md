# Deployment and Rollback Runbook

This document outlines the procedures for deploying the Randomtrip web application to staging and production environments, managing environment variables, setting up monitoring, and performing emergency rollbacks.

## Table of Contents
1.  [Deployment Process](#1-deployment-process)
    *   [Staging Environment](#11-staging-environment)
    *   [Production Environment](#11-production-environment)
2.  [Environment Variables](#2-environment-variables)
3.  [Monitoring Setup](#3-monitoring-setup)
4.  [Emergency Rollback Procedures](#4-emergency-rollback-procedures)

---

## 1. Deployment Process

### 1.1 Staging Environment

The staging environment is used for testing new features and changes before they are deployed to production.

**Platform:** Vercel (or similar CI/CD platform configured for staging deployments)

**Steps:**
1.  Ensure all changes are merged into the `develop` branch.
2.  A pull request from `feature` branch to `develop` branch will trigger an automatic deployment to the staging environment via Vercel's Git integration.
3.  Verify the deployment status in the Vercel dashboard.
4.  Perform thorough testing on the staging environment.

### 1.2 Production Environment

The production environment hosts the live application accessible to users.

**Platform:** Vercel (or similar CI/CD platform configured for production deployments)

**Steps:**
1.  Ensure all changes have been thoroughly tested and approved in the staging environment.
2.  Merge the `develop` branch into the `main` branch.
3.  A push to the `main` branch will trigger an automatic production deployment via Vercel's Git integration.
4.  Monitor the deployment status in the Vercel dashboard.
5.  Perform a quick smoke test on the live production environment to ensure basic functionality.

---

## 2. Environment Variables

Environment variables are crucial for configuring the application for different environments (development, staging, production).

**Required Environment Variables:**

*   `NEXT_PUBLIC_BACKEND_API_URL`: The URL of the backend API.
*   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API Key for frontend services.
*   `MERCADOPAGO_ACCESS_TOKEN`: Mercado Pago access token for payment processing (backend).
*   `DATABASE_URL`: Database connection string (backend).
*   `FRONTEND_URL`: The URL of the frontend application (backend).
*   `BACKEND_URL`: The URL of the backend application (backend).

**Management in Vercel:**
1.  Go to your project settings in Vercel.
2.  Navigate to "Environment Variables".
3.  Add each variable, specifying whether it applies to "Development", "Preview" (Staging), or "Production" environments.
4.  Ensure sensitive keys are not exposed in public repositories.

---

## 3. Monitoring Setup

Effective monitoring is essential for identifying and resolving issues quickly.

**Recommended Tools:**

*   **Vercel Analytics/Logs:** Built-in Vercel features provide basic analytics and access to deployment logs.
*   **Sentry (or similar error tracking):** For real-time error reporting and performance monitoring.
    *   Integrate Sentry SDKs into both frontend and backend applications.
    *   Configure appropriate DSNs for each environment.
*   **UptimeRobot (or similar uptime monitoring):** To monitor the availability of the application endpoints.
    *   Set up alerts for downtime.

**Key Metrics to Monitor:**

*   Application uptime and response times.
*   Error rates (server-side and client-side).
*   API request latency.
*   Database connection and query performance.
*   Resource utilization (CPU, memory).

---

## 4. Emergency Rollback Procedures

In case of critical issues in production, a quick rollback to a stable version is necessary.

**Procedure:**

1.  **Identify the Problem:** Confirm the issue is critical and requires an immediate rollback. Check monitoring alerts and user reports.
2.  **Identify Stable Deployment:** In Vercel, go to your project's "Deployments" tab. Identify the last known stable deployment.
3.  **Initiate Rollback:**
    *   Click on the stable deployment.
    *   Click the "Redeploy" or "Rollback" button (Vercel typically allows redeploying a previous successful build).
    *   Confirm the rollback.
4.  **Monitor Rollback:** Observe the deployment status in Vercel.
5.  **Verify Stability:** Once the rollback is complete, perform a smoke test on the application to ensure the issue is resolved and the application is stable.
6.  **Post-Rollback Analysis:**
    *   Investigate the root cause of the issue that necessitated the rollback.
    *   Create a post-mortem document.
    *   Implement preventative measures to avoid recurrence.
    *   Plan a fix for the rolled-back features in a new development cycle.