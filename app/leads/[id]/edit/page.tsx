import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLeadById } from '@/lib/db/leads';
import { Navbar } from '@/components/Navbar';
import { LeadForm } from '@/components/leads/LeadForm';
import { Card, CardBody } from '@/components/ui/Card';
import { ChevronRight, ArrowLeft } from 'lucide-react';

interface EditLeadPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditLeadPageProps) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) {
    return { title: 'Edit Lead — Not Found' };
  }

  return {
    title: `Edit ${lead.name} — AI Event Lead Manager`,
  };
}

export default async function EditLeadPage({ params }: EditLeadPageProps) {
  const { id } = await params;
  const lead = await getLeadById(id);

  if (!lead) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Navigation Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leads</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <Link href={`/leads/${lead.id}`} className="hover:text-slate-900 transition-colors truncate max-w-[160px]">
            {lead.name}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-800">Edit</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Edit Lead</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Update information, conversation notes, or follow-up status for <strong>{lead.name}</strong>.
          </p>
        </div>

        {/* Form Card */}
        <Card className="shadow-2xs border-slate-200/90">
          <CardBody className="p-5 sm:p-7">
            <LeadForm initialData={lead} isEdit={true} />
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
