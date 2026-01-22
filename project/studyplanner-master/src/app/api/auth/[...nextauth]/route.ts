import NextAuth, { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";

// Check if Azure AD is configured
const hasAzureConfig = 
  process.env.AZURE_AD_CLIENT_ID && 
  process.env.AZURE_AD_CLIENT_SECRET && 
  process.env.AZURE_AD_TENANT_ID;

const providers: any[] = [];

// Always add credentials provider first (for demo mode)
providers.push(
  CredentialsProvider({
    id: "credentials",
    name: "Demo Account",
    credentials: {
      email: { label: "Email", type: "email", placeholder: "demo@example.com" },
    },
    async authorize(credentials) {
      // Simple mock authentication - accepts any email
      if (credentials?.email) {
        const user = {
          id: "demo-user-123",
          name: "Demo User",
          email: credentials.email,
          image: "https://ui-avatars.com/api/?name=Demo+User&background=3B82F6&color=fff",
        };
        console.log("Demo login successful:", user);
        return user;
      }
      console.log("Demo login failed: no email provided");
      return null;
    },
  })
);

// Add Azure AD provider if configured (will be used as primary)
if (hasAzureConfig) {
  providers.unshift(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID ?? "",
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? "",
      tenantId: "common",
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Handle Azure AD login
      if (account?.provider === "azure-ad") {
        token.accessToken = account.access_token;
        if (profile) {
          token.id = profile.sub;
        }
      }
      // Handle credentials (demo) login
      if (account?.provider === "credentials") {
        if (user) {
          token.id = user.id;
          console.log("JWT callback - credentials login, user ID:", user.id);
        }
      }
      // Fallback: use user.id if available (first time)
      if (user && !token.id) {
        token.id = user.id;
        console.log("JWT callback - fallback, user ID:", user.id);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        console.log("Session callback - user ID set:", token.id);
      } else {
        console.log("Session callback - no user ID in token:", token);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

