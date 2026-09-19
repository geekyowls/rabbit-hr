'use client';

import './globals.css';
import { SessionProvider } from '@/contexts/session-context';
import { QueryProvider } from '@/providers/query-provider';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { DisplayPrefsProvider } from '@/contexts/display-prefs-context';
import { GlitchtipInit } from '@/components/glitchtip-init';
import { ChunkErrorRecovery } from '@/components/chunk-error-recovery';
import { OpenPanelComponent } from '@openpanel/nextjs';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

function GoogleOAuthWrapper({ children }: { children: React.ReactNode }) {
  if (!GOOGLE_CLIENT_ID) {
    return <>{children}</>;
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>RabbitHR</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="RabbitHR" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var p=JSON.parse(localStorage.getItem('rabbithr-display-prefs')||'{}');var e=document.documentElement;e.setAttribute('data-text-size',p.textSize||'md');e.setAttribute('data-bold-text',String(!!p.boldText));}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} dark:text-dark-text antialiased font-sans`}
        suppressHydrationWarning
      >
        <GlitchtipInit />
        <ChunkErrorRecovery />
        {process.env.NEXT_PUBLIC_OPENPANEL_DASHBOARD_CLIENT_ID && (
          <OpenPanelComponent
            clientId={process.env.NEXT_PUBLIC_OPENPANEL_DASHBOARD_CLIENT_ID}
            apiUrl="https://analytics.rabbithr.co/api"
            trackScreenViews={true}
            trackOutgoingLinks={true}
          />
        )}
        <GoogleOAuthWrapper>
          <ThemeProvider>
            <DisplayPrefsProvider>
              <QueryProvider>
                <SessionProvider>{children}</SessionProvider>
              </QueryProvider>
            </DisplayPrefsProvider>
            <Toaster />
          </ThemeProvider>
        </GoogleOAuthWrapper>
      </body>
    </html>
  );
}
