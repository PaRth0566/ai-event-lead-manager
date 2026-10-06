'use client';

import React, { useState } from 'react';
import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { Markdown } from '@/components/ui/Markdown';
import { copyTextToClipboard } from '@/lib/clipboard';
import { markdownToPlainText } from '@/lib/markdown';
import { FileText, Send, Copy, Check, AlertCircle, RefreshCw, Pencil, Eye } from 'lucide-react';

interface AIAssistantSectionProps {
  lead: Lead;
  onFeedback?: (message: string, type?: 'success' | 'error') => void;
}

export function AIAssistantSection({ lead, onFeedback }: AIAssistantSectionProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryCopied, setSummaryCopied] = useState(false);

  const [isDrafting, setIsDrafting] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draftCopied, setDraftCopied] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryError(null);

    try {
      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes: lead.notes,
          name: lead.name,
          company: lead.company,
          event: lead.event,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to generate summary at this time. Please try again.");
      }

      setSummary(data.data.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't generate summary. Please try again.";
      setSummaryError(msg);
      onFeedback?.("Couldn't generate summary", 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDraftFollowUp = async () => {
    setIsDrafting(true);
    setDraftError(null);

    try {
      const res = await fetch('/api/ai/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          company: lead.company,
          event: lead.event,
          notes: lead.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to draft follow-up at this time. Please try again.");
      }

      setDraft(data.data.draft);
      setIsEditingDraft(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't generate follow-up draft. Please try again.";
      setDraftError(msg);
      onFeedback?.("Couldn't generate follow-up", 'error');
    } finally {
      setIsDrafting(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'summary' | 'draft') => {
    const ok = await copyTextToClipboard(text);
    if (ok) {
      if (type === 'summary') {
        setSummaryCopied(true);
        onFeedback?.('Summary copied', 'success');
        setTimeout(() => setSummaryCopied(false), 2000);
      } else {
        setDraftCopied(true);
        onFeedback?.('Follow-up copied', 'success');
        setTimeout(() => setDraftCopied(false), 2000);
      }
    } else {
      onFeedback?.("Couldn't copy to clipboard", 'error');
    }
  };

  return (
    <Card id="ai-assistant-section" className="border-slate-200/90 shadow-2xs scroll-mt-20">
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">AI Assistant</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Practical tools to summarize interaction notes or draft attendee follow-ups.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSummarize}
              isLoading={isSummarizing}
              className="w-full sm:w-auto"
              leftIcon={<FileText className="w-3.5 h-3.5 text-slate-600" />}
            >
              {isSummarizing ? 'Summarizing...' : summary ? 'Regenerate summary' : 'Summarize notes'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDraftFollowUp}
              isLoading={isDrafting}
              className="w-full sm:w-auto"
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              {isDrafting ? 'Drafting...' : draft ? 'Regenerate draft' : 'Draft follow-up'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardBody className="p-4 sm:p-6 space-y-4">
        {/* Placeholder state before generation */}
        {!summary && !draft && !isSummarizing && !isDrafting && !summaryError && !draftError && (
          <div className="text-center py-6 px-4 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-slate-500">
            <p className="text-xs leading-relaxed">
              Select <strong className="text-slate-700">Summarize notes</strong> to extract structured takeaways, or{' '}
              <strong className="text-slate-700">Draft follow-up</strong> to prepare a tailored outreach message.
            </p>
          </div>
        )}

        {/* Error notifications */}
        {summaryError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{summaryError}</span>
            <button
              type="button"
              onClick={handleSummarize}
              className="text-xs font-semibold underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {draftError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{draftError}</span>
            <button
              type="button"
              onClick={handleDraftFollowUp}
              className="text-xs font-semibold underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Generated Summary Card */}
        {summary && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4 transition-all">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/70">
              <span className="text-xs font-semibold text-slate-900">Summary</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(markdownToPlainText(summary), 'summary')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {summaryCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                <Tooltip label="Regenerate summary">
                  <button
                    type="button"
                    onClick={handleSummarize}
                    disabled={isSummarizing}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Regenerate summary"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <Markdown text={summary} />
            </div>
          </div>
        )}

        {/* Generated Follow-up Message */}
        {draft && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs transition-all">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-900">Follow-up Draft</span>
              <div className="flex items-center gap-2">
                <Tooltip label={isEditingDraft ? 'Preview formatting' : 'Edit draft text'}>
                  <button
                    type="button"
                    onClick={() => setIsEditingDraft((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                    aria-label={isEditingDraft ? 'Preview formatted draft' : 'Edit draft as plain text'}
                  >
                    {isEditingDraft ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                  </button>
                </Tooltip>
                <button
                  type="button"
                  onClick={() => copyToClipboard(markdownToPlainText(draft), 'draft')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer"
                >
                  {draftCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold text-emerald-300">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-300" />
                      <span>Copy Message</span>
                    </>
                  )}
                </button>
                <Tooltip label="Regenerate draft">
                  <button
                    type="button"
                    onClick={handleDraftFollowUp}
                    disabled={isDrafting}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer disabled:cursor-not-allowed"
                    aria-label="Regenerate draft"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isDrafting ? 'animate-spin' : ''}`} />
                  </button>
                </Tooltip>
              </div>
            </div>

            <div>
              {isEditingDraft ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={8}
                  className="w-full max-w-full box-border text-xs sm:text-sm text-slate-800 bg-slate-50/70 p-3 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white resize-y leading-relaxed font-sans"
                  aria-label="Editable follow-up email draft"
                />
              ) : (
                <div className="bg-slate-50/70 p-3 rounded-md border border-slate-200">
                  <Markdown text={draft} />
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                {isEditingDraft
                  ? 'Editing plain text — switch back to preview to see the formatting.'
                  : 'Review the formatted draft, or edit its text before copying.'}
              </p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
