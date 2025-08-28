import * as z from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Email is required' }),
  password: z.string().min(6, { message: 'Password is required' }),
});

export const RegisterSchema = z.object({
  email: z.string().email({ message: 'Email is required' }),
  password: z.string().min(6, { message: 'Minumum 6 characters required' }),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username must be less than 20 characters' })
    .regex(/^[a-zA-Z0-9!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?_]+$/, {
      message: 'Username can contain letters, numbers, and special characters',
    }),
});

export const EditUserSchema = z
  .object({
    username: z
      .string()
      .min(3, { message: 'Username must be at least 3 characters' })
      .max(20, { message: 'Username must be less than 20 characters' })
      .regex(/^[a-zA-Z0-9!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?_]+$/, {
        message:
          'Username can contain letters, numbers, and special characters',
      }),
    email: z.string().email({ message: 'Email is required' }),
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // If newPassword is provided, currentPassword must also be provided
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Current password is required when setting a new password',
      path: ['currentPassword'],
    },
  )
  .refine(
    (data) => {
      // If newPassword is provided, it must be at least 6 characters
      if (data.newPassword && data.newPassword.length < 6) {
        return false;
      }
      return true;
    },
    {
      message: 'New password must be at least 6 characters',
      path: ['newPassword'],
    },
  );
