import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Event Lead Manager — Lightweight Conference & Meeting CRM',
  description:
    'Capture, track, and manage business leads from conferences and summits with AI-powered notes summarization and intelligent follow-up email drafts.',
  keywords: ['CRM', 'Leads', 'Event Management', 'AI CRM', 'Sales Leads', 'Conference CRM'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50/50 text-slate-900 font-sans">
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>
              <strong>AI Event Lead Manager</strong> &bull; Conference & Event CRM
            </span>
            <span>Next.js &bull; TypeScript &bull; PostgreSQL</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
