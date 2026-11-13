import { z } from "zod";

const noHeaderBreaks = (value: string) => !/[\r\n]/.test(value);

export const churchContactSchema = z.object({
  churchSlug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9-]+$/i, "Invalid church."),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100)
    .refine(noHeaderBreaks, "Name cannot contain line breaks."),
  email: z.string().trim().email("Please enter a valid email address.").max(160),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z
    .string()
    .trim()
    .min(3, "Subject must be at least 3 characters.")
    .max(150)
    .refine(noHeaderBreaks, "Subject cannot contain line breaks."),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters.")
    .max(2000),
});
