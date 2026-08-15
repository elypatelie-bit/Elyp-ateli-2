import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/entrar'
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    }),
    // Login por telefone: o usuário já verificou o OTP na rota /api/otp/verify,
    // que cria/atualiza o User e retorna um token de uso único (VerificationToken)
    // que esse provider troca por uma sessão.
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Telefone',
      credentials: {
        phone: { label: 'Telefone', type: 'text' },
        verificationToken: { label: 'Token', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.verificationToken) return null;

        const record = await prisma.verificationToken.findUnique({
          where: { identifier_token: { identifier: credentials.phone, token: credentials.verificationToken } }
        });
        if (!record || record.expires < new Date()) return null;

        await prisma.verificationToken.delete({
          where: { identifier_token: { identifier: credentials.phone, token: credentials.verificationToken } }
        });

        const user = await prisma.user.upsert({
          where: { phone: credentials.phone },
          update: { phoneVerified: new Date() },
          create: { phone: credentials.phone, phoneVerified: new Date(), role: 'CUSTOMER' }
        });

        return { id: user.id, name: user.name, email: user.email, phone: user.phone } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: (user as any).id } });
        token.role = dbUser?.role ?? 'CUSTOMER';
        token.uid = (user as any).id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    }
  }
};
