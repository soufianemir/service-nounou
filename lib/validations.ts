import { z } from "zod";

export const EmailSchema = z.string().email("Email invalide").max(200);
export const PasswordSchema = z
  .string()
  .min(10, "Mot de passe trop court (10+)")
  .max(200)
  .regex(/[A-Z]/, "Ajoutez une majuscule")
  .regex(/[a-z]/, "Ajoutez une minuscule")
  .regex(/[0-9]/, "Ajoutez un chiffre");

export const signUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: EmailSchema,
  password: PasswordSchema
});

export const loginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1)
});

export const SignupSchema = signUpSchema;
export const LoginSchema = loginSchema;
