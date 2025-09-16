import { z, ZodError } from 'zod';

export const loginSchema = z.object({
  email: z.email().nonempty(),
  password: z.string().nonempty(),
});

export const registerSchema = z.object({
  email: z.email().nonempty(),
  password: z.string().min(8).nonempty(),
});

export type loginInput = z.infer<typeof loginSchema>;
export type registerInput = z.infer<typeof registerSchema>;

export function validateErrorMessage (error: ZodError) {
  return {
    statusCode: 422,
    body: JSON.stringify({
      message: error.issues,
    }),
  };
};