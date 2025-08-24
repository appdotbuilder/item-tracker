import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  username: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Image schema
export const imageSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number().int(),
  mime_type: z.string(),
  created_at: z.coerce.date()
});

export type Image = z.infer<typeof imageSchema>;

// Input schema for user registration
export const registerUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  username: z.string().min(3).max(50)
});

export type RegisterUserInput = z.infer<typeof registerUserInputSchema>;

// Input schema for user login
export const loginUserInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginUserInput = z.infer<typeof loginUserInputSchema>;

// Input schema for uploading images
export const uploadImageInputSchema = z.object({
  user_id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  file_path: z.string(),
  file_size: z.number().int().positive(),
  mime_type: z.string()
});

export type UploadImageInput = z.infer<typeof uploadImageInputSchema>;

// Input schema for getting user images
export const getUserImagesInputSchema = z.object({
  user_id: z.number()
});

export type GetUserImagesInput = z.infer<typeof getUserImagesInputSchema>;

// Input schema for deleting images
export const deleteImageInputSchema = z.object({
  image_id: z.number(),
  user_id: z.number() // Ensure user owns the image
});

export type DeleteImageInput = z.infer<typeof deleteImageInputSchema>;

// Auth response schema
export const authResponseSchema = z.object({
  user: userSchema.omit({ password_hash: true }),
  token: z.string().optional() // JWT token for session management
});

export type AuthResponse = z.infer<typeof authResponseSchema>;