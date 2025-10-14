
import CredentialsProvider from 'next-auth/providers/credentials';
import NextAuth, { type User } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

declare module 'next-auth' {
  interface User {
    id: string;
    role: 'USER' | 'ADMIN';
    rememberMe?: boolean;
  }
}

declare module 'next-auth' {
  interface Session {
    rememberMe: boolean;
    user: User;
  }
}

declare module '@auth/core/jwt'{
  interface JWT {
    role?: 'USER' | 'ADMIN';
    rememberMe?: boolean;
    exp?: number;      
    expire?: string;    
  }
}
export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        rememberMe: { label: 'Remember me', type: 'checkbox'},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;
          const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) return null;
        const rememberMe = credentials.rememberMe === 'true';
        return {
          id: String(user.id),
          name: user.fullname,
          email: user.email,
          role:user.role,
          rememberMe,
        };
      },
    }),
  ],

  pages: {
    signIn: '/auth/login',
  },

  session: {
    strategy: 'jwt', 

  },

  callbacks: {
    async jwt({ token, user }) {

      if (user) {
        token.role = user.role;
        const u = user as User & { rememberMe?: boolean };
        token.rememberMe = u.rememberMe;
         
        const maxAge = token.rememberMe
          ? 30 * 24 * 60 * 60 
          : 24 * 60 * 60;    
        token.exp = Math.floor(Date.now() / 1000) + maxAge;
        token.expire = new Date(token.exp * 1000).toISOString();
      }
      return token;
    },
      async session({ session, token }) {
       session.user.role = token.role as 'USER' | 'ADMIN';
      if (token.exp) {
        session.expires = token.expire as unknown as string & Date;
      }
      return session;
    }
  }
});



