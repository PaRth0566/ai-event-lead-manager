import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Lead } from '@/types/lead';

interface DeleteConfirmModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteConfirmModal({
  lead,
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteConfirmModalProps) {
  if (!lead) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" title="Delete lead?">
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          This will permanently remove <strong>{lead.name}</strong> from your records. This action cannot be undone.
        </p>

        <div className="bg-slate-50 p-3 rounded-md border border-slate-200/80 text-xs text-slate-600 space-y-0.5">
          <div className="font-semibold text-slate-900 truncate">{lead.name}</div>
          <div className="text-slate-500 truncate">
            {lead.company} &bull; {lead.event}
          </div>
          <div className="text-slate-400 font-mono truncate">{lead.email}</div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} isLoading={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete Lead'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
