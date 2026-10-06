'use client';

import React, { useState } from 'react';
import { Lead } from '@/types/lead';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Markdown } from '@/components/ui/Markdown';
import { copyTextToClipboard } from '@/lib/clipboard';
import { markdownToPlainText } from '@/lib/markdown';
import { FileText, Send, Copy, Check, AlertCircle, RefreshCw, Pencil, Eye } from 'lucide-react';

interface QuickAIModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onFeedback?: (message: string, type?: 'success' | 'error') => void;
}

/**
 * Compact AI assistant surfaced directly from the leads list.
 * Lets the user summarize notes or draft a follow-up without
 * navigating into the lead detail page.
 *
 * Results reset per lead — the parent remounts this component
 * with a `key` so each lead starts with a clean slate.
 */
export function QuickAIModal({ lead, isOpen, onClose, onFeedback }: QuickAIModalProps) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [isDrafting, setIsDrafting] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  const [copied, setCopied] = useState<'summary' | 'draft' | null>(null);

  const handleSummarize = async () => {
    if (!lead) return;
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
        throw new Error(data.error || 'Unable to generate summary at this time.');
      }

      setSummary(data.data.summary);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't generate summary.";
      setSummaryError(msg);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDraft = async () => {
    if (!lead) return;
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
        throw new Error(data.error || 'Unable to draft follow-up at this time.');
      }

      setDraft(data.data.draft);
      setIsEditingDraft(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't generate follow-up draft.";
      setDraftError(msg);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopy = async (text: string, type: 'summary' | 'draft') => {
    const ok = await copyTextToClipboard(markdownToPlainText(text));
    if (ok) {
      setCopied(type);
      onFeedback?.(type === 'summary' ? 'Summary copied' : 'Follow-up copied', 'success');
      setTimeout(() => setCopied(null), 2000);
    } else {
      onFeedback?.("Couldn't copy to clipboard", 'error');
    }
  };

  const isGenerating = isSummarizing || isDrafting;

  return (
    <Modal
      isOpen={isOpen && Boolean(lead)}
      onClose={onClose}
      title="AI Assistant"
      description={lead ? `${lead.name} · ${lead.company} · ${lead.event}` : undefined}
      maxWidth="md"
      dismissible={!isGenerating}
    >
      <div className="space-y-4">
        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSummarize}
            isLoading={isSummarizing}
            leftIcon={<FileText className="w-3.5 h-3.5 text-slate-600" />}
          >
            {isSummarizing ? 'Summarizing...' : summary ? 'Regenerate summary' : 'Summarize notes'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDraft}
            isLoading={isDrafting}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            {isDrafting ? 'Drafting...' : draft ? 'Regenerate draft' : 'Draft follow-up'}
          </Button>
        </div>

        {/* Placeholder before first run */}
        {!summary && !draft && !isSummarizing && !isDrafting && !summaryError && !draftError && (
          <div className="text-center py-5 px-4 bg-slate-50/60 rounded-lg border border-dashed border-slate-200 text-slate-500">
            <p className="text-xs leading-relaxed">
              Run <strong className="text-slate-700">Summarize notes</strong> or{' '}
              <strong className="text-slate-700">Draft follow-up</strong> right from the list — no
              need to open the lead.
            </p>
          </div>
        )}

        {/* Errors */}
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
              onClick={handleDraft}
              className="text-xs font-semibold underline hover:no-underline cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary result */}
        {summary && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70">
              <span className="text-xs font-semibold text-slate-900">Summary</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(summary, 'summary')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {copied === 'summary' ? (
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
                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={isSummarizing}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Regenerate summary"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              <Markdown text={summary} />
            </div>
          </div>
        )}

        {/* Draft result */}
        {draft && (
          <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-900">Follow-up Draft</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(draft, 'draft')}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-md shadow-2xs transition-colors cursor-pointer"
                >
                  {copied === 'draft' ? (
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
                <button
                  type="button"
                  onClick={() => setIsEditingDraft((prev) => !prev)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                  aria-label={isEditingDraft ? 'Preview formatted draft' : 'Edit draft as plain text'}
                  title={isEditingDraft ? 'Preview formatting' : 'Edit draft text'}
                >
                  {isEditingDraft ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={handleDraft}
                  disabled={isDrafting}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Regenerate draft"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDrafting ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            {isEditingDraft ? (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={7}
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
        )}
      </div>
    </Modal>
  );
}
