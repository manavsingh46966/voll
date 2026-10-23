import { z } from "zod";

/**
 * FRONTEND REGISTRATION SCHEMA
 * Validates the raw inputs from the User Interface (React Hook Form).
 *
 * * NOTE: The backend expects a single 'name' field.
 * * We collect 'firstName' and 'lastName' separately here for better UX
 * * and merge them inside the 'auth.api.ts' function before sending.
 */

export const PersonalDetailsSchema = z.object({
  // --- Step 1: Personal Info ---
  firstName: z
    .string()
    .min(2, "First name is required")
    .max(50, "Name too long")
    .regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),

  lastName: z
    .string()
    .min(2, "Last name is required")
    .max(50, "Name too long")
    .regex(/^[a-zA-Z\s]+$/, "Only letters allowed"),

  // Using coerce.date() allows the form to handle both Date objects and ISO strings safely
  dateOfBirth: z.coerce.date().refine((date) => {
    // Age Check: User must be 13+
    const ageDifMs = Date.now() - date.getTime();
    const ageDate = new Date(ageDifMs); // miliseconds from epoch
    return Math.abs(ageDate.getUTCFullYear() - 1970) >= 13;
  }, "You must be at least 13 years old."),

  gender: z.enum(["Male", "Female", "Other"]).catch("Other"),

  city: z.string().min(2, "City is required"),

  // --- Step 2: Contact (Validated even if pre-filled) ---
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Invalid phone number"),

  // --- Step 3: Optional / Professional ---
  website: z
    .string()
    .url("Please enter a valid URL (https://...)")
    .optional()
    .or(z.literal("")),
});

// --- STEP 2: INTERESTS ---
export const InterestsSchema = z.object({
  interests: z
    .array(z.string())
    .min(1, "Select at least 1 interest")
    .max(10, "Select up to 10 interests"),
});

// --- STEP 3: SKILLS ---
export const SkillsSchema = z.object({
  skills: z.array(z.string()).min(1, "Select at least 1 skill"),
});

// --- FINAL MERGED SCHEMA (For Final Submission) ---
export const RegistrationSchema =
  PersonalDetailsSchema.merge(InterestsSchema).merge(SkillsSchema);

// Helper Type
export type RegistrationFormType = z.infer<typeof RegistrationSchema>;

// This type exactly matches your 'RegistrationData' interface in 'form.types.ts'
export type RegistrationSchemaType = z.infer<typeof RegistrationSchema>;
