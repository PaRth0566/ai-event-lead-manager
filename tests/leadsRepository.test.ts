import { describe, it, expect } from 'bun:test';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
  getUniqueEvents,
} from '../lib/db/leads';

describe('Leads Repository CRUD Operations', () => {
  it('retrieves initial leads list', async () => {
    const leads = await getLeads();
    expect(leads.length).toBeGreaterThan(0);
    expect(leads[0].id).toBeDefined();
    expect(leads[0].name).toBeDefined();
  });

  it('creates a new lead and assigns UUID', async () => {
    const newLeadInput = {
      name: 'Test Attendee',
      company: 'Test Ventures',
      email: 'test.attendee@ventureshq.com',
      event: 'TestCon 2026',
      notes: 'Initial test interaction notes.',
      follow_up_status: 'pending' as const,
    };

    const created = await createLead(newLeadInput);
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Test Attendee');
    expect(created.email).toBe('test.attendee@ventureshq.com');
    expect(created.follow_up_status).toBe('pending');

    // Verify it is retrievable by ID
    const found = await getLeadById(created.id);
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Test Attendee');
  });

  it('updates an existing lead', async () => {
    const lead = await createLead({
      name: 'Update Target',
      company: 'Initial Corp',
      email: 'updates@targetcorp.com',
      event: 'Summit 2026',
      notes: 'Before update.',
      follow_up_status: 'pending',
    });

    const updated = await updateLead(lead.id, {
      follow_up_status: 'contacted',
      notes: 'Updated interaction notes with follow-up details.',
    });

    expect(updated).not.toBeNull();
    expect(updated?.follow_up_status).toBe('contacted');
    expect(updated?.notes).toContain('Updated interaction notes');
  });

  it('deletes a lead and confirms removal', async () => {
    const lead = await createLead({
      name: 'Delete Target',
      company: 'Ephemeral Inc',
      email: 'delete.me@ephemeralhq.com',
      event: 'Flash Summit',
      notes: 'To be deleted.',
      follow_up_status: 'pending',
    });

    const success = await deleteLead(lead.id);
    expect(success).toBe(true);

    const check = await getLeadById(lead.id);
    expect(check).toBeNull();
  });

  it('filters leads by search term across fields', async () => {
    const results = await getLeads({ search: 'Acme' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((l) => l.company.toLowerCase().includes('acme'))).toBe(true);
  });

  it('filters leads by status', async () => {
    const pendingLeads = await getLeads({ status: 'pending' });
    expect(pendingLeads.every((l) => l.follow_up_status === 'pending')).toBe(true);
  });

  it('calculates correct lead stats', async () => {
    const stats = await getLeadStats();
    expect(stats.total).toBeGreaterThanOrEqual(1);
    expect(stats.pending + stats.contacted + stats.completed).toBe(stats.total);
  });

  it('retrieves unique events list', async () => {
    const events = await getUniqueEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(Array.isArray(events)).toBe(true);
  });

  it('handles non-existent lead lookup, update, and deletion safely', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    const found = await getLeadById(nonExistentId);
    expect(found).toBeNull();

    const updated = await updateLead(nonExistentId, { notes: 'Should fail' });
    expect(updated).toBeNull();

    const deleted = await deleteLead(nonExistentId);
    expect(deleted).toBe(false);
  });

  it('combines search and status filters simultaneously', async () => {
    const results = await getLeads({ search: 'Tech Summit', status: 'pending' });
    expect(
      results.every((l) => l.event.includes('Tech Summit') && l.follow_up_status === 'pending')
    ).toBe(true);
  });
});
