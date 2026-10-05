const BASE = 'http://localhost:3000';

async function run() {
  console.log('--- 1. Testing GET /api/leads ---');
  let res = await fetch(`${BASE}/api/leads`);
  let data = await res.json();
  console.log(`Success: ${data.success}, Leads count: ${data.data?.leads?.length}`);
  console.log('Stats:', data.data?.stats);

  console.log('\n--- 2. Testing POST /api/leads (Create Lead) ---');
  const newLead = {
    name: 'Vikram Malhotra',
    company: 'Horizon AI',
    email: 'vikram.malhotra@horizonai.com',
    event: 'Tech Summit 2026',
    notes: 'Met Vikram at the networking lounge. He leads engineering. Looking for automated follow-up workflows and requested a pilot trial next month.',
    follow_up_status: 'pending',
  };
  res = await fetch(`${BASE}/api/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newLead),
  });
  data = await res.json();
  console.log(`Create Success: ${data.success}, ID: ${data.data?.id}, Name: ${data.data?.name}`);
  const createdId = data.data?.id;

  console.log('\n--- 3. Testing GET /api/leads/[id] ---');
  res = await fetch(`${BASE}/api/leads/${createdId}`);
  data = await res.json();
  console.log(`Get Lead Success: ${data.success}, Found: ${data.data?.name} at ${data.data?.company}`);

  console.log('\n--- 4. Testing PATCH /api/leads/[id] (Update status to contacted) ---');
  res = await fetch(`${BASE}/api/leads/${createdId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ follow_up_status: 'contacted' }),
  });
  data = await res.json();
  console.log(`Patch Success: ${data.success}, New status: ${data.data?.follow_up_status}`);

  console.log('\n--- 5. Testing POST /api/ai/summarize ---');
  res = await fetch(`${BASE}/api/ai/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notes: newLead.notes,
      name: newLead.name,
      company: newLead.company,
      event: newLead.event,
    }),
  });
  data = await res.json();
  console.log(`AI Summarize Success: ${data.success}, Provider: ${data.data?.provider}`);
  console.log('Generated Summary:\n' + data.data?.summary);

  console.log('\n--- 6. Testing POST /api/ai/followup ---');
  res = await fetch(`${BASE}/api/ai/followup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newLead.name,
      company: newLead.company,
      event: newLead.event,
      notes: newLead.notes,
    }),
  });
  data = await res.json();
  console.log(`AI Followup Success: ${data.success}, Provider: ${data.data?.provider}`);
  console.log('Generated Draft:\n' + data.data?.draft);

  console.log('\n--- 7. Testing Search and Filter ---');
  res = await fetch(`${BASE}/api/leads?search=Vikram&status=contacted`);
  data = await res.json();
  console.log(`Filtered Search Leads count: ${data.data?.leads?.length}`);
  console.log(`Found: ${data.data?.leads?.[0]?.name}`);

  console.log('\n--- 8. Testing DELETE /api/leads/[id] ---');
  res = await fetch(`${BASE}/api/leads/${createdId}`, { method: 'DELETE' });
  data = await res.json();
  console.log(`Delete Success: ${data.success}`);

  console.log('\n--- 9. Verifying Lead Was Removed ---');
  res = await fetch(`${BASE}/api/leads/${createdId}`);
  data = await res.json();
  console.log(`Get Deleted Lead Status: ${res.status} (Expected 404), Success: ${data.success}`);

  console.log('\nALL 9 END-TO-END VERIFICATION CHECKS COMPLETED!');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
