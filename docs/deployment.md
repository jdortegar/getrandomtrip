# Deployment Guide for Randomtrip

This document outlines the steps required to deploy the Randomtrip application.

## Prerequisites

*   Node.js (LTS version)
*   npm or Yarn
*   Docker (optional, for containerized deployment)
*   A PostgreSQL database instance
*   Mercado Pago API credentials
*   Google Maps API Key (for Places Autocomplete)

## Environment Variables

Create a `.env` file in the project root based on `.env.example` and populate it with your specific environment variables:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:3001

DATABASE_URL="postgresql://user:password@localhost:5432/randomtrip?schema=public"
MERCADO_PAGO_ACCESS_TOKEN=YOUR_MERCADO_PAGO_ACCESS_TOKEN
```

## Backend Deployment

1.  **Install Dependencies:**

    ```bash
    cd backend
    npm install
    ```

2.  **Database Migrations:**

    Ensure your PostgreSQL database is running and accessible. Then, apply Prisma migrations:

    ```bash
    npx prisma migrate deploy
    ```

3.  **Build the Backend:**

    ```bash
    npm run build
    ```

4.  **Start the Backend Server:**

    ```bash
    npm start
    ```

    For production, consider using a process manager like PM2 or a containerization solution.

## Frontend Deployment

1.  **Install Dependencies:**

    ```bash
    cd frontend
    npm install
    ```

2.  **Build the Frontend:**

    ```bash
    npm run build
    ```

3.  **Start the Frontend Server:**

    ```bash
    npm start
    ```

    This will start the Next.js production server. For production, you might want to use a service like Vercel or deploy to a custom server with a reverse proxy.

## Full Application Deployment (Example with PM2)

This is a basic example for running both frontend and backend with PM2 on a single server.

1.  **Install PM2 globally:**

    ```bash
    npm install -g pm2
    ```

2.  **Create a PM2 ecosystem file (e.g., `ecosystem.config.js` in the project root):**

    ```javascript
    module.exports = {
      apps : [{
        name: "randomtrip-backend",
        script: "backend/dist/index.js",
        cwd: "./backend",
        watch: false,
        env: {
          NODE_ENV: "production",
          # Add your environment variables here, or load from .env
        }
      }, {
        name: "randomtrip-frontend",
        script: "frontend/node_modules/.bin/next",
        args: "start",
        cwd: "./frontend",
        watch: false,
        env: {
          NODE_ENV: "production",
          # Add your environment variables here, or load from .env
        }
      }]
    };
    ```

3.  **Start applications with PM2:**

    ```bash
    pm2 start ecosystem.config.js
    ```

4.  **Save PM2 process list and configure startup on boot:**

    ```bash
    pm2 save
    pm2 startup
    ```

## CI/CD Integration

Refer to `.github/workflows/ci.yml` for CI/CD pipeline configuration. Ensure your deployment process integrates with your chosen CI/CD system for automated builds and deployments.

## Monitoring and Logging

Implement appropriate monitoring and logging solutions for both frontend and backend applications to ensure their health and performance in production.

## Security Considerations

*   Use HTTPS for all communication.
*   Secure your database credentials.
*   Regularly update dependencies to patch security vulnerabilities.
*   Implement proper input validation and sanitization.