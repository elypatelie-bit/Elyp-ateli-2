import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Elyp Ateliê',
  description: 'Guias e fios de conta feitos à mão, um elo com sua fé.',
  manifest: '/manifest.json',
  themeColor: '#0C2D6B'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
