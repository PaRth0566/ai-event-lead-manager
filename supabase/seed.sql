-- ============================================================================
-- Seed: seed.sql
-- Project: AI Event Lead Manager
-- Description: Realistic fictional attendees for quick setup and testing.
-- Re-runnable: refreshes the demo rows if they already exist.
-- ============================================================================

INSERT INTO public.leads (id, name, company, email, event, notes, follow_up_status, created_at, updated_at)
VALUES
(
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Rahul Sharma',
    'Acme Technologies',
    'rahul.sharma@acmetech.com',
    'Tech Summit 2026',
    'Met Rahul at the AI in Enterprise booth at Tech Summit 2026. He manages sales operations at Acme. They currently struggle with disjointed customer reporting across 4 regional hubs. He expressed high interest in our analytics and automated reporting module, and explicitly requested a 30-minute product walkthrough next Tuesday at 2 PM IST.',
    'pending',
    timezone('utc'::text, now() - INTERVAL '3 days'),
    timezone('utc'::text, now() - INTERVAL '3 days')
),
(
    'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    'Elena Rostova',
    'Vanguard Cloud Solutions',
    'elena.rostova@vanguardcloud.io',
    'SaaS Expo 2026',
    'Elena attended our keynote session on unified pipeline architecture. She is the VP of Engineering at Vanguard. Their current infrastructure spends 15% too much time on manual data ETL. Discussed our automated connector SDK. Sent an introductory slide deck; she replied acknowledging receipt and wants to loop in her lead architect before committing to a pilot.',
    'contacted',
    timezone('utc'::text, now() - INTERVAL '2 days'),
    timezone('utc'::text, now() - INTERVAL '1 day')
),
(
    'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f',
    'Aarav Patel',
    'Nexus FinTech',
    'aarav.patel@nexusfintech.com',
    'ProductCon Mumbai',
    'Aarav stopped by after the fireside chat. Heading Product Growth at Nexus. They need real-time fraud monitoring alerts integrated with their internal dashboard. Completed two technical validation calls and verified security compliance checklist. Contract signed for Q2 rollout; onboarding kick-off scheduled for April 10th.',
    'completed',
    timezone('utc'::text, now() - INTERVAL '5 days'),
    timezone('utc'::text, now() - INTERVAL '4 hours')
),
(
    'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a',
    'Sarah Jenkins',
    'Pulse Dynamics',
    'sarah.jenkins@pulsedynamics.com',
    'Startup Connect 2026',
    'Met Sarah at the founder lounge. She is building an AI-assisted healthcare workflow engine. They are looking to replace their current transcription API with something that has lower latency and HIPAA-compliant data residency. Asked for pricing tiers for volume above 100k requests/month.',
    'pending',
    timezone('utc'::text, now() - INTERVAL '1 day'),
    timezone('utc'::text, now() - INTERVAL '1 day')
),
(
    'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b',
    'Devon Miller',
    'HyperScale Retail',
    'devon.miller@hyperscaleretail.com',
    'Tech Summit 2026',
    'Devon is Senior Director of Supply Chain Systems at HyperScale Retail. He noticed our showcase on real-time event alerts. They suffer from inventory stockout lag across 200 stores. Sent our benchmark case study and followed up via LinkedIn. Waiting on budget approval from their quarterly steering committee.',
    'contacted',
    timezone('utc'::text, now() - INTERVAL '6 days'),
    timezone('utc'::text, now() - INTERVAL '2 days')
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    company = EXCLUDED.company,
    email = EXCLUDED.email,
    event = EXCLUDED.event,
    notes = EXCLUDED.notes,
    follow_up_status = EXCLUDED.follow_up_status,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;
