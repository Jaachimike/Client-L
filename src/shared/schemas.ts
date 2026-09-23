import { z } from 'zod';
import { isHexColor } from './color';
import { isIsoDate } from './dates';
import { parseLinks } from './links';

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be ${max} characters or fewer.`).default('');

export const clientInputSchema = z.object({
  id: z.string().trim().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'Enter a client name.')
    .max(200, 'Name must be 200 characters or fewer.'),
  contactPerson: optionalText(200, 'Contact person'),
  email: z
    .string()
    .trim()
    .max(320)
    .default('')
    .refine(
      (v) => v === '' || z.string().email().safeParse(v).success,
      'Enter a valid email address.',
    ),
  phone: optionalText(50, 'Phone'),
  notes: optionalText(5000, 'Notes'),
});
export type ClientInput = z.input<typeof clientInputSchema>;

export const taskInputSchema = z.object({
  id: z.string().trim().optional(),
  clientId: z.string().trim().min(1, 'Choose a client.'),
  title: z
    .string()
    .trim()
    .min(1, 'Enter a task title.')
    .max(200, 'Title must be 200 characters or fewer.'),
  description: optionalText(10000, 'Description'),
  links: z
    .string()
    .default('')
    .superRefine((value, ctx) => {
      const parsed = parseLinks(value);
      if (!parsed.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: parsed.message });
    }),
  dueDate: z
    .string()
    .trim()
    .default('')
    .refine((v) => v === '' || isIsoDate(v), 'Enter the due date as a real date.'),
});
export type TaskInput = z.input<typeof taskInputSchema>;

export const statusSchema = z.object({
  id: z.string().trim().min(1),
  name: z
    .string()
    .trim()
    .min(1, 'Every status needs a name.')
    .max(40, 'Status names must be 40 characters or fewer.'),
  color: z.string().refine(isHexColor, 'Colours must be a hex value such as #2A0CD0.'),
  done: z.boolean(),
  retired: z.boolean(),
});

export const statusListSchema = z
  .array(statusSchema)
  .min(1, 'Keep at least one status.')
  .refine((list) => list.some((s) => !s.retired), 'Keep at least one status that is not retired.')
  .refine(
    (list) => new Set(list.map((s) => s.name.toLowerCase())).size === list.length,
    'Two statuses have the same name. Give each one a different name.',
  )
  .refine(
    (list) => new Set(list.map((s) => s.id)).size === list.length,
    'Status IDs must be unique.',
  );

export const emailListSchema = z
  .array(z.string().trim().toLowerCase().email('One of the allowed emails is not a valid address.'))
  .min(1, 'Keep at least one allowed email, or nobody can open the app.');

export const idSchema = z.string().trim().min(1, 'Missing record ID.');
export const statusNameSchema = z.string().trim().min(1, 'Choose a status.');

export const taskFiltersSchema = z
  .object({
    clientId: z.string().optional(),
    status: z.string().optional(),
    due: z.enum(['any', 'overdue', 'week', 'none']).optional(),
    search: z.string().max(200).optional(),
  })
  .default({});
