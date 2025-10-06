import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { Pool } from 'pg';

// Create Better Auth instance with PostgreSQL database
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'],
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      // Add Owen Barnes as initial admin by email
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
  ],
  // baseURL: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3004',
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ['read:user'], // Just user scope, not email
    },
  },
  // Enable session management
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours (update session every 24 hours)
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  // User configuration
  // user: {
  //   additionalFields: {
  //     displayName: {
  //       type: 'string',
  //       required: false,
  //       input: true,
  //     },
  //     monsterGenerations: {
  //       type: 'number',
  //       required: false,
  //       defaultValue: 0,
  //       input: false,
  //     },
  //     lastGeneration: {
  //       type: 'date',
  //       required: false,
  //       input: false,
  //     },
  //     githubUsername: {
  //       type: 'string',
  //       required: false,
  //       input: false,
  //     },
  //     repoCount: {
  //       type: 'number',
  //       required: false,
  //       input: false,
  //     },
  //   },
  //   // Try to make email optional
  //   fields: {
  //     email: {
  //       type: 'string',
  //       required: false,
  //       unique: false,
  //       input: false,
  //     },
  //   },
  // },
});

// Export types for use in components
export type Session = typeof auth.$Infer.Session;
export type User = Session['user'];
