/**
 * Authentication Middleware
 *
 * Currently returns a fixed user for local development.
 *
 * TODO: To add real authentication in the future:
 * 1. Install a JWT library (e.g., @fastify/jwt) or use an auth service (Clerk, Auth0, NextAuth)
 * 2. Update this function to:
 *    - Extract token from Authorization header (Bearer token) or cookie
 *    - Verify the token
 *    - Return the user ID from the token payload
 * 3. Add login/logout endpoints
 * 4. Update the frontend to include auth headers
 *
 * Example with JWT:
 * ```
 * import jwt from '@fastify/jwt'
 *
 * export async function getCurrentUser(request: FastifyRequest): Promise<{ userId: string }> {
 *   try {
 *     const decoded = await request.jwtVerify()
 *     return { userId: decoded.sub }
 *   } catch (err) {
 *     throw new Error('Unauthorized')
 *   }
 * }
 * ```
 *
 * Example with Clerk:
 * ```
 * import { getAuth } from '@clerk/fastify'
 *
 * export async function getCurrentUser(request: FastifyRequest): Promise<{ userId: string }> {
 *   const { userId } = getAuth(request)
 *   if (!userId) throw new Error('Unauthorized')
 *   return { userId }
 * }
 * ```
 */

export function getCurrentUser(): { userId: string } {
  // For local development, always return the same user
  return { userId: 'local-user' };
}
