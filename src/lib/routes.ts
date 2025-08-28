/**
 * `publicRoutes` is an array of strings representing the client-side routes that are accessible to all users,
 * regardless of their authentication status. These routes typically include pages that do not require user login.
 *
 * Usage:
 * - Use these routes to define paths that are open to the public, such as the home page or informational pages.
 *
 * Example:
 * - The default public route is the home page: `/`
 */
export const publicRoutes = ['/', '/plan/'];

/**
 * `authRoutes` is an array of strings representing the client-side routes for authentication-related pages.
 * These routes are used to define the paths for user login and registration within the application.
 *
 * Usage:
 * - Utilize these routes to navigate users to the appropriate authentication pages.
 *
 * Example:
 * - To navigate to the login page, use: `navigate(authRoutes[0])` which resolves to `/auth/login`
 * - To navigate to the registration page, use: `navigate(authRoutes[1])` which resolves to `/auth/register`
 */
export const authRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/auth/reset',
  '/auth/new-password',
];

/**
 * `apiAuthPrefix` is a constant that defines the base URL path for authentication-related API routes.
 * This prefix is used to organize and standardize the routing of authentication endpoints within the application.
 *
 * Usage:
 * - Append this prefix to any authentication-related route to ensure consistency across the API.
 *
 * Example:
 * - Full authentication route: `${apiAuthPrefix}/providers` would resolve to `/api/auth/providers`
 */
export const apiAuthPrefix = '/api/auth';

export const DEFAULT_LOGIN_REDIRECT = '/';
