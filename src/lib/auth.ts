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
      // PRIVACY-FIRST AUTHENTICATION
      // We request zero OAuth scopes and use GitHub's GraphQL API to fetch
      // ONLY the user's unique database ID. No name, email, avatar, location,
      // or any other personal information is requested or stored.
      //
      // GraphQL query: `query { viewer { databaseId } }`
      //
      // This is provably minimal data collection - auditors can verify the
      // exact query we send and confirm we only receive a single integer.
      scope: [],
      disableDefaultScope: true,
      getUserInfo: async (token) => {
        const query = 'query { viewer { databaseId } }';

        const response = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        const result = await response.json();
        const githubId = result.data?.viewer?.databaseId;

        // Privacy audit log: confirm we only received the user ID
        console.log('[Auth] GitHub OAuth - Privacy-minimal authentication');
        console.log('[Auth] GraphQL query sent:', query);
        console.log('[Auth] Complete API response:', JSON.stringify(result));
        console.log('[Auth] Only data extracted: databaseId =', githubId);

        if (!githubId) {
          console.error('[Auth] Failed to retrieve GitHub user ID');
          throw new Error('GitHub authentication failed: unable to retrieve user ID');
        }

        // All user fields except ID are synthetic - no personal data stored
        return {
          user: {
            id: String(githubId),
            name: `user-${githubId}`,
            email: `${githubId}@noreply.monsters.ink`,
            image: undefined,
            emailVerified: false,
          },
          data: { id: githubId },
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
