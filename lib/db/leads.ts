import { Lead, CreateLeadInput, UpdateLeadInput, LeadStats, LeadFilters } from '@/types/lead';
import { getSupabaseServerClient, isSupabaseConfigured } from './supabase';
import { randomUUID } from 'crypto';

// In-memory fallback dataset for seamless initial evaluation if Supabase credentials are pending
const initialDemoLeads: Lead[] = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Rahul Sharma',
    company: 'Acme Technologies',
    email: 'rahul.sharma@acmetech.example.com',
    event: 'Tech Summit 2026',
    notes:
      'Met Rahul at the AI in Enterprise booth at Tech Summit 2026. He manages sales operations at Acme. They currently struggle with disjointed customer reporting across 4 regional hubs. He expressed high interest in our analytics and automated reporting module, and explicitly requested a 30-minute product walkthrough next Tuesday at 2 PM IST.',
    follow_up_status: 'pending',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    name: 'Elena Rostova',
    company: 'Vanguard Cloud Solutions',
    email: 'elena.rostova@vanguardcloud.example.io',
    event: 'SaaS Expo 2026',
    notes:
      'Elena attended our keynote session on unified pipeline architecture. She is the VP of Engineering at Vanguard. Their current infrastructure spends 15% too much time on manual data ETL. Discussed our automated connector SDK. Sent an introductory slide deck; she replied acknowledging receipt and wants to loop in her lead architect before committing to a pilot.',
    follow_up_status: 'contacted',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f',
    name: 'Aarav Patel',
    company: 'Nexus FinTech',
    email: 'aarav.patel@nexusfin.example.org',
    event: 'ProductCon Mumbai',
    notes:
      'Aarav stopped by after the fireside chat. Heading Product Growth at Nexus. They need real-time fraud monitoring alerts integrated with their internal dashboard. Completed two technical validation calls and verified security compliance checklist. Contract signed for Q2 rollout; onboarding kick-off scheduled for April 10th.',
    follow_up_status: 'completed',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a',
    name: 'Sarah Jenkins',
    company: 'Pulse Dynamics',
    email: 'sarah.j@pulsedynamics.example.com',
    event: 'Startup Connect 2026',
    notes:
      'Met Sarah at the founder lounge. She is building an AI-assisted healthcare workflow engine. They are looking to replace their current transcription API with something that has lower latency and HIPAA-compliant data residency. Asked for pricing tiers for volume above 100k requests/month.',
    follow_up_status: 'pending',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b',
    name: 'Devon Miller',
    company: 'HyperScale Retail',
    email: 'devon.miller@hyperscale.example.com',
    event: 'Tech Summit 2026',
    notes:
      'Devon is Senior Director of Supply Chain Systems at HyperScale Retail. He noticed our showcase on real-time event alerts. They suffer from inventory stockout lag across 200 stores. Sent our benchmark case study and followed up via LinkedIn. Waiting on budget approval from their quarterly steering committee.',
    follow_up_status: 'contacted',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Persistent across module imports in node process
declare global {
  var __demoLeadsStore: Lead[] | undefined;
}

function getDemoStore(): Lead[] {
  if (!global.__demoLeadsStore) {
    global.__demoLeadsStore = [...initialDemoLeads];
  }
  return global.__demoLeadsStore;
}

export function getDatabaseStatus(): { isConnectedToSupabase: boolean; provider: 'supabase' | 'demo' } {
  const configured = isSupabaseConfigured();
  return {
    isConnectedToSupabase: configured,
    provider: configured ? 'supabase' : 'demo',
  };
}

/**
 * Retrieve all leads with optional filtering and search
 */
export async function getLeads(filters?: LeadFilters): Promise<Lead[]> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('follow_up_status', filters.status);
      }

      if (filters?.event && filters.event !== 'all') {
        query = query.eq('event', filters.event);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Supabase getLeads error:', error);
        throw new Error(error.message);
      }

      let results: Lead[] = data || [];

      // Apply text search on name, company, email, event
      if (filters?.search && filters.search.trim()) {
        const s = filters.search.trim().toLowerCase();
        results = results.filter(
          (lead) =>
            lead.name.toLowerCase().includes(s) ||
            lead.company.toLowerCase().includes(s) ||
            lead.email.toLowerCase().includes(s) ||
            lead.event.toLowerCase().includes(s)
        );
      }

      return results;
    } catch (err) {
      console.error('Failed to query Supabase, using fallback store:', err);
      // Fallback if Supabase table not created yet
    }
  }

  // Fallback demo store
  let leads = [...getDemoStore()];

  if (filters?.status && filters.status !== 'all') {
    leads = leads.filter((l) => l.follow_up_status === filters.status);
  }

  if (filters?.event && filters.event !== 'all') {
    leads = leads.filter((l) => l.event === filters.event);
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim().toLowerCase();
    leads = leads.filter(
      (l) =>
        l.name.toLowerCase().includes(s) ||
        l.company.toLowerCase().includes(s) ||
        l.email.toLowerCase().includes(s) ||
        l.event.toLowerCase().includes(s)
    );
  }

  // Sort descending by created_at
  leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return leads;
}

/**
 * Retrieve a single lead by its UUID
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
      if (error) {
        if (error.code === 'PGRST116') return null; // record not found
        console.error('Supabase getLeadById error:', error);
        throw new Error(error.message);
      }
      return data;
    } catch (err) {
      console.error('Failed to query Supabase single lead, checking demo store:', err);
    }
  }

  const leads = getDemoStore();
  const found = leads.find((l) => l.id === id);
  return found || null;
}

/**
 * Insert a new lead into the database
 */
export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const now = new Date().toISOString();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert([
          {
            name: input.name.trim(),
            company: input.company.trim(),
            email: input.email.trim(),
            event: input.event.trim(),
            notes: input.notes.trim(),
            follow_up_status: input.follow_up_status,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Supabase createLead error:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      console.error('Failed to create in Supabase, falling back to demo store:', err);
    }
  }

  const newLead: Lead = {
    id: randomUUID(),
    name: input.name.trim(),
    company: input.company.trim(),
    email: input.email.trim(),
    event: input.event.trim(),
    notes: input.notes.trim(),
    follow_up_status: input.follow_up_status,
    created_at: now,
    updated_at: now,
  };

  const store = getDemoStore();
  store.unshift(newLead);
  return newLead;
}

/**
 * Update an existing lead record
 */
export async function updateLead(id: string, input: UpdateLeadInput): Promise<Lead | null> {
  const now = new Date().toISOString();
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const updatePayload: Record<string, unknown> = {
        updated_at: now,
      };

      if (input.name !== undefined) updatePayload.name = input.name.trim();
      if (input.company !== undefined) updatePayload.company = input.company.trim();
      if (input.email !== undefined) updatePayload.email = input.email.trim();
      if (input.event !== undefined) updatePayload.event = input.event.trim();
      if (input.notes !== undefined) updatePayload.notes = input.notes.trim();
      if (input.follow_up_status !== undefined) updatePayload.follow_up_status = input.follow_up_status;

      const { data, error } = await supabase
        .from('leads')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase updateLead error:', error);
        throw new Error(error.message);
      }

      return data;
    } catch (err) {
      console.error('Failed to update in Supabase, falling back to demo store:', err);
    }
  }

  const store = getDemoStore();
  const index = store.findIndex((l) => l.id === id);
  if (index === -1) return null;

  const current = store[index];
  const updated: Lead = {
    ...current,
    name: input.name !== undefined ? input.name.trim() : current.name,
    company: input.company !== undefined ? input.company.trim() : current.company,
    email: input.email !== undefined ? input.email.trim() : current.email,
    event: input.event !== undefined ? input.event.trim() : current.event,
    notes: input.notes !== undefined ? input.notes.trim() : current.notes,
    follow_up_status: input.follow_up_status !== undefined ? input.follow_up_status : current.follow_up_status,
    updated_at: now,
  };

  store[index] = updated;
  return updated;
}

/**
 * Delete a lead by ID
 */
export async function deleteLead(id: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteLead error:', error);
        throw new Error(error.message);
      }
      return true;
    } catch (err) {
      console.error('Failed to delete in Supabase, checking demo store:', err);
    }
  }

  const store = getDemoStore();
  const index = store.findIndex((l) => l.id === id);
  if (index === -1) return false;

  store.splice(index, 1);
  return true;
}

/**
 * Calculate lead statistics for the dashboard
 */
export async function getLeadStats(): Promise<LeadStats> {
  const leads = await getLeads();

  return {
    total: leads.length,
    pending: leads.filter((l) => l.follow_up_status === 'pending').length,
    contacted: leads.filter((l) => l.follow_up_status === 'contacted').length,
    completed: leads.filter((l) => l.follow_up_status === 'completed').length,
  };
}

/**
 * Extract unique event names for filter dropdowns
 */
export async function getUniqueEvents(): Promise<string[]> {
  const leads = await getLeads();
  const set = new Set(leads.map((l) => l.event).filter(Boolean));
  return Array.from(set).sort();
}
