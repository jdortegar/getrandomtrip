import { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger, session: clientSession }) {
      if (user) {
        token.id = user.id;
      }

      // Handle session updates from client
      if (trigger === 'update' && clientSession) {
        return { ...token, ...clientSession };
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        // Fetch latest user data from database
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            name: true,
            email: true,
            travelerType: true,
            interests: true,
            dislikes: true,
          },
        });

        if (dbUser) {
          session.user.name = dbUser.name;
          session.user.email = dbUser.email;
          (session.user as any).travelerType = dbUser.travelerType;
          (session.user as any).interests = dbUser.interests;
          (session.user as any).dislikes = dbUser.dislikes;
        }
      }
      return session;
    },
  },
};

/**
 * Server-side function to assert user is a tripper
 * Redirects to home if not authenticated or not a tripper
 */
export async function assertTripper() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });
  
  if (!user || user.role !== 'tripper') {
    redirect('/');
  }
  
  return user;
}

/**
 * Client-side function to get user role from local storage or session
 * This is a placeholder - in production, use session data
 */
export function getUserRole(): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('user-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.state?.user?.role || null;
    }
  } catch (error) {
    console.error('Error getting user role:', error);
  }
  
  return null;
}
