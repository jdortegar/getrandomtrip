# Randomtrip Web App

This project delivers the Randomtrip web application, focusing on providing a unique surprise travel experience. The MVP includes core functionalities for trip planning, user authentication, and personalized user profiles.

## Project Structure

- `frontend/`: Next.js + Tailwind CSS application, including user interface, authentication flows, and user dashboards.
- `backend/`: Node.js + Prisma API, handling data, business logic, and integrations.
- `infra/`: Infrastructure as Code (Docker Compose/Terraform) and CI/CD configurations.
- `qa/`: Quality Assurance documentation, manual test plans, and automated test suites.
- `docs/`: General project documentation, including user flows, guidelines, and team workflows.

## Technologies

- **Frontend:** Next.js, React, Tailwind CSS, Zustand (for state management)
- **Backend:** Node.js, Prisma, PostgreSQL (or similar)
- **CI/CD:** GitHub Actions
- **Other:** Lucide React (icons)

## Features

- **Surprise Trip Planning:** Core flow for users to configure their surprise trips.
- **User Authentication:** Dummy sign-in/sign-up flow with preference onboarding.
- **Personalized Dashboard:** "Mis Viajes" section with upcoming, past, and canceled trips, countdown, and payment history.
- **User Profile Management:** Dedicated "Mi Perfil" page for viewing and managing personal data and travel preferences.
- **Responsive Design:** Optimized for various devices using Tailwind CSS.

## Getting Started

To set up and run the Randomtrip web application locally, follow these steps:

### Prerequisites

- Node.js (LTS version recommended)
- npm (usually comes with Node.js)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/your-repo/randomtrip.git
cd randomtrip
```

### 2. Backend Setup

Navigate to the `backend/` directory, install dependencies, and set up the database.

```bash
cd backend
npm install
# Set up your database (e.g., create a .env file with DATABASE_URL)
# npx prisma migrate dev --name init (if using Prisma for the first time)
npm run dev # Or your specific backend start command
```

### 3. Frontend Setup

Open a new terminal, navigate to the `frontend/` directory, and install dependencies.

```bash
cd frontend
npm install
npm run dev
```

Once both the backend and frontend servers are running, open your browser and visit `http://localhost:3000` (or the port specified by your frontend).

## Milestones

- **MVP 1.0:** Core features as defined in `UserFlow.md` and prioritized by the Product Manager, including initial authentication and user profile functionalities.

## Documentation

- **User Flow:** Refer to `UserFlow.md` for a detailed overview of the user journey.
- **Team Workflow:** Refer to `TeamWorkflow.md` for details on collaboration and development processes.

## Contributing

Contributions are welcome! Please refer to `TeamWorkflow.md` for guidelines on how to contribute.

## License

[Specify your project's license here, e.g., MIT License]
