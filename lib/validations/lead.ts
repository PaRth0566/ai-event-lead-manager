import { z } from 'zod';

export const followUpStatusEnum = z.enum(['pending', 'contacted', 'completed'], {
  message: "Status must be 'pending', 'contacted', or 'completed'",
});

export const leadSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  company: z
    .string({ message: 'Company is required' })
    .trim()
    .min(1, 'Company is required')
    .max(100, 'Company must be 100 characters or fewer'),
  email: z
    .string({ message: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(150, 'Email must be 150 characters or fewer'),
  event: z
    .string({ message: 'Event name is required' })
    .trim()
    .min(1, 'Event name is required')
    .max(120, 'Event name must be 120 characters or fewer'),
  notes: z
    .string({ message: 'Interaction notes are required' })
    .trim()
    .min(1, 'Interaction notes are required')
    .max(2500, 'Notes must be 2,500 characters or fewer'),
  follow_up_status: followUpStatusEnum.default('pending'),
});

export const leadUpdateSchema = leadSchema.partial();

export const aiSummarizeSchema = z.object({
  notes: z
    .string({ message: 'Notes are required for summarization' })
    .trim()
    .min(5, 'Notes must contain at least 5 characters to summarize')
    .max(5000, 'Notes must be 5,000 characters or fewer'),
  name: z.string().optional(),
  company: z.string().optional(),
  event: z.string().optional(),
});

export const aiFollowUpSchema = z.object({
  name: z.string().trim().min(1, 'Lead name is required'),
  company: z.string().trim().min(1, 'Company name is required'),
  event: z.string().trim().min(1, 'Event name is required'),
  notes: z.string().trim().min(5, 'Notes are required to draft a relevant follow-up'),
});

export type LeadFormData = z.infer<typeof leadSchema>;
export type LeadUpdateData = z.infer<typeof leadUpdateSchema>;
export type AISummarizeInput = z.infer<typeof aiSummarizeSchema>;
export type AIFollowUpInput = z.infer<typeof aiFollowUpSchema>;
