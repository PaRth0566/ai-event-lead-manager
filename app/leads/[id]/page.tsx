import React from 'react';
import Link from 'next/link';
import { getLeadById } from '@/lib/db/leads';
import { Navbar } from '@/components/Navbar';
import { LeadDetailsView } from '@/components/leads/LeadDetailsView';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Users } from 'lucide-react';

interface LeadPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: LeadPageProps) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) {
    return { title: 'Lead Not Found — AI Event Lead Manager' };
  }

  return {
    title: `${lead.name} (${lead.company}) — AI Event Lead Manager`,
    description: `Lead details and AI assistant for ${lead.name} from ${lead.company} at ${lead.event}.`,
  };
}

export default async function LeadDetailPage({ params }: LeadPageProps) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Lead Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">
            The lead you are trying to view does not exist or may have been deleted.
          </p>
          <Link href="/">
            <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Dashboard
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <LeadDetailsView initialLead={lead} />
      </main>
    </div>
  );
}
