
'use client';

import { Navbar } from '@/components/layout/navbar';
import { useLanguage } from '@/context/language-context';
import { Bot, Construction } from 'lucide-react';

export default function InsightsPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <Construction className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="font-headline text-3xl md:text-4xl text-foreground font-bold mb-4">
            Insights Coming Soon
          </h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            We are working hard to bring you powerful new data visualizations and insights. Please check back later!
          </p>
        </div>
      </main>
    </div>
  );
}
