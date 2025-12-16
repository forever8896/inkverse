import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import { Pool } from 'pg';

// Create Better Auth instance with PostgreSQL database
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
  trustedOrigins: [
    'http://localhost:3004',
    ...(process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : [])
  ],
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      // Add Owen Barnes as initial admin by email
      impersonationSessionDuration: 60 * 60, // 1 hour
    }),
  ],
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004',
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: [], // Request no OAuth scopes - minimal data collection
      disableDefaultScope: true, // Prevent Better Auth from adding default scopes
      // PRIVACY: Use GraphQL to request ONLY the user's unique ID
      // This is provably minimal - we literally only ask for one field
      getUserInfo: async (token) => {
        const response = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: `query { viewer { databaseId } }`,
          }),
        });

        const result = await response.json();
        const githubId = result.data?.viewer?.databaseId;

        console.log('\n========== GITHUB GRAPHQL RESPONSE ==========');
        console.log('Raw response:', JSON.stringify(result, null, 2));
        console.log('Extracted ID:', githubId);
        console.log('==============================================\n');

        if (!githubId) {
          throw new Error('Failed to get GitHub user ID');
        }

        // Return minimal synthetic user data
        // Only the GitHub ID is real - everything else is generated
        return {
          user: {
            id: String(githubId),
            name: `user-${githubId}`, // Synthetic name
            email: `${githubId}@noreply.monsters.ink`, // Synthetic email
            image: undefined, // No avatar - we didn't request it
            emailVerified: false,
          },
          data: { id: githubId }, // Raw data for reference
        };
      },
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
