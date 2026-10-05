export type FollowUpStatus = 'pending' | 'contacted' | 'completed';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  event: string;
  notes: string;
  follow_up_status: FollowUpStatus;
  created_at: string;
  updated_at: string;
}

export type CreateLeadInput = {
  name: string;
  company: string;
  email: string;
  event: string;
  notes: string;
  follow_up_status: FollowUpStatus;
};

export type UpdateLeadInput = Partial<CreateLeadInput>;

export interface LeadStats {
  total: number;
  pending: number;
  contacted: number;
  completed: number;
}

export interface LeadFilters {
  search?: string;
  status?: FollowUpStatus | 'all';
  event?: string;
}
