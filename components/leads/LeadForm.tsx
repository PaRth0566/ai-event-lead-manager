'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lead, CreateLeadInput, FollowUpStatus } from '@/types/lead';
import { leadSchema } from '@/lib/validations/lead';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';

interface LeadFormProps {
  initialData?: Lead;
  isEdit?: boolean;
}

export function LeadForm({ initialData, isEdit = false }: LeadFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateLeadInput>({
    name: initialData?.name || '',
    company: initialData?.company || '',
    email: initialData?.email || '',
    event: initialData?.event || '',
    notes: initialData?.notes || '',
    follow_up_status: initialData?.follow_up_status || 'pending',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const statusOptions: { value: FollowUpStatus; label: string }[] = [
    { value: 'pending', label: 'Pending — Needs follow-up' },
    { value: 'contacted', label: 'Contacted — Message sent' },
    { value: 'completed', label: 'Completed — Discussion resolved' },
  ];

  const handleChange = (field: keyof CreateLeadInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validation = leadSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEdit ? `/api/leads/${initialData?.id}` : '/api/leads';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        if (result.details) {
          const detailErrors: Record<string, string> = {};
          Object.entries(result.details).forEach(([key, val]) => {
            detailErrors[key] = Array.isArray(val) ? val[0] : String(val);
          });
          setErrors(detailErrors);
        }
        throw new Error(result.error || 'Failed to save lead record');
      }

      const targetId = isEdit ? initialData?.id : result.data?.id;
      if (targetId) {
        router.push(`/leads/${targetId}`);
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong while saving';
      setServerError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      {serverError && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Section 1: Contact Information */}
      <div className="space-y-4">
        <div className="border-b border-slate-200/80 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Contact Information
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Name"
            required
            placeholder="e.g. Rahul Sharma"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            autoComplete="name"
          />

          <Input
            label="Company"
            required
            placeholder="e.g. Acme Technologies"
            value={formData.company}
            onChange={(e) => handleChange('company', e.target.value)}
            error={errors.company}
            autoComplete="organization"
          />
        </div>

        <div>
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. rahul@acme.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
        </div>
      </div>

      {/* Section 2: Event & Pipeline */}
      <div className="space-y-4">
        <div className="border-b border-slate-200/80 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Event & Pipeline
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Event Name"
            required
            placeholder="e.g. Tech Summit 2026"
            value={formData.event}
            onChange={(e) => handleChange('event', e.target.value)}
            error={errors.event}
            helperText="Where did you meet this contact?"
          />

          <Select
            label="Follow-up Status"
            required
            options={statusOptions}
            value={formData.follow_up_status}
            onChange={(e) => handleChange('follow_up_status', e.target.value as FollowUpStatus)}
            error={errors.follow_up_status}
            helperText="Current stage of communication"
          />
        </div>
      </div>

      {/* Section 3: Interaction Notes */}
      <div className="space-y-4">
        <div className="border-b border-slate-200/80 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Interaction Notes
          </h2>
        </div>

        <div>
          <Textarea
            label="Notes & Takeaways"
            required
            rows={6}
            maxChars={2500}
            placeholder="Record conversational context, pain points, topics discussed, or agreed next steps..."
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            error={errors.notes}
            helperText="These notes provide context for AI summaries and follow-up email drafts."
          />
        </div>
      </div>

      {/* Form Action Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link href={isEdit && initialData ? `/leads/${initialData.id}` : '/'}>
          <Button variant="ghost" type="button" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Cancel
          </Button>
        </Link>

        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          leftIcon={<Check className="w-3.5 h-3.5" />}
        >
          {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Lead'}
        </Button>
      </div>
    </form>
  );
}
