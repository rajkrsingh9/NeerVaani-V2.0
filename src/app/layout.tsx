import type { Metadata } from 'next';
import { AuthProvider } from '@/context/auth-context';
import { LanguageProvider } from '@/context/language-context';
import { LanguageSelector } from '@/components/ui/language-selector';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/context/theme-provider';
import { Logo } from '@/components/icons/logo';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeerVaani Web',
  description: 'AI-powered personal assistant for farmers',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body className="font-body antialiased bg-background">
        <div className="splash-screen">
          <Logo className="splash-logo" textClassName="text-5xl" />
        </div>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <LanguageProvider>
              {children}
              <LanguageSelector />
              <Toaster />
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
        
        <elevenlabs-convai agent-id="agent_8801k144ptm0fkq83at8ybf672d1"></elevenlabs-convai>
        <script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
      </body>
    </html>
  );
}
