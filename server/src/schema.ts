import { z } from 'zod';

// Workspace schemas
export const workspaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Workspace = z.infer<typeof workspaceSchema>;

export const createWorkspaceInputSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  description: z.string().nullable()
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;

export const updateWorkspaceInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Workspace name is required').optional(),
  description: z.string().nullable().optional()
});

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceInputSchema>;

// Storage Room schemas
export const storageRoomSchema = z.object({
  id: z.number(),
  workspace_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StorageRoom = z.infer<typeof storageRoomSchema>;

export const createStorageRoomInputSchema = z.object({
  workspace_id: z.number(),
  name: z.string().min(1, 'Storage room name is required'),
  description: z.string().nullable()
});

export type CreateStorageRoomInput = z.infer<typeof createStorageRoomInputSchema>;

export const updateStorageRoomInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Storage room name is required').optional(),
  description: z.string().nullable().optional()
});

export type UpdateStorageRoomInput = z.infer<typeof updateStorageRoomInputSchema>;

// Storage Location schemas
export const storageLocationSchema = z.object({
  id: z.number(),
  storage_room_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  location_type: z.string().nullable(), // e.g., "Box", "Dresser", "Closet", "Underbed storage"
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StorageLocation = z.infer<typeof storageLocationSchema>;

export const createStorageLocationInputSchema = z.object({
  storage_room_id: z.number(),
  name: z.string().min(1, 'Storage location name is required'),
  description: z.string().nullable(),
  location_type: z.string().nullable(),
  image_url: z.string().nullable()
});

export type CreateStorageLocationInput = z.infer<typeof createStorageLocationInputSchema>;

export const updateStorageLocationInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Storage location name is required').optional(),
  description: z.string().nullable().optional(),
  location_type: z.string().nullable().optional(),
  image_url: z.string().nullable().optional()
});

export type UpdateStorageLocationInput = z.infer<typeof updateStorageLocationInputSchema>;

// Item schemas
export const itemSchema = z.object({
  id: z.number(),
  storage_location_id: z.number(),
  description: z.string(),
  color: z.string().nullable(),
  quantity: z.number().int().nonnegative(),
  location_within_room: z.string().nullable(), // e.g., "Top shelf", "Bottom drawer"
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Item = z.infer<typeof itemSchema>;

export const createItemInputSchema = z.object({
  storage_location_id: z.number(),
  description: z.string().min(1, 'Item description is required'),
  color: z.string().nullable(),
  quantity: z.number().int().nonnegative().default(1),
  location_within_room: z.string().nullable(),
  image_url: z.string().nullable()
});

export type CreateItemInput = z.infer<typeof createItemInputSchema>;

export const updateItemInputSchema = z.object({
  id: z.number(),
  description: z.string().min(1, 'Item description is required').optional(),
  color: z.string().nullable().optional(),
  quantity: z.number().int().nonnegative().optional(),
  location_within_room: z.string().nullable().optional(),
  image_url: z.string().nullable().optional()
});

export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;

// Search schemas
export const searchInputSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  workspace_id: z.number().optional() // Optional workspace filter
});

export type SearchInput = z.infer<typeof searchInputSchema>;

export const searchResultSchema = z.object({
  items: z.array(itemSchema.extend({
    workspace_name: z.string(),
    storage_room_name: z.string(),
    storage_location_name: z.string()
  }))
});

export type SearchResult = z.infer<typeof searchResultSchema>;

// Generic schemas for common operations
export const idInputSchema = z.object({
  id: z.number()
});

export type IdInput = z.infer<typeof idInputSchema>;

export const workspaceIdInputSchema = z.object({
  workspace_id: z.number()
});

export type WorkspaceIdInput = z.infer<typeof workspaceIdInputSchema>;

export const storageRoomIdInputSchema = z.object({
  storage_room_id: z.number()
});

export type StorageRoomIdInput = z.infer<typeof storageRoomIdInputSchema>;

export const storageLocationIdInputSchema = z.object({
  storage_location_id: z.number()
});

export type StorageLocationIdInput = z.infer<typeof storageLocationIdInputSchema>;