import { z } from "zod";

export const CreateAccountDetailsSchema = z.object({
  name: z.string(),
  dateOfBirth: z.preprocess((value) => {
    if (typeof value === "string" || value instanceof Date) {
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
  }, z.date()),
  gender: z.string(),
  city: z.string(),
  phoneNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  website: z.string().optional().nullable(),
  interests: z.array(z.string()),
  skillsets: z.array(z.string()),
});

export type CreateAccountDetails = z.infer<typeof CreateAccountDetailsSchema>;
