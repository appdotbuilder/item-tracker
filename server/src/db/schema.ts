import { serial, text, pgTable, timestamp, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const imagesTable = pgTable('images', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(), // Generated unique filename
  original_name: text('original_name').notNull(), // Original filename uploaded by user
  file_path: text('file_path').notNull(), // Full path to the stored file
  file_size: integer('file_size').notNull(), // File size in bytes
  mime_type: varchar('mime_type', { length: 100 }).notNull(), // e.g., 'image/jpeg', 'image/png'
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  images: many(imagesTable)
}));

export const imagesRelations = relations(imagesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [imagesTable.user_id],
    references: [usersTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect; // For SELECT operations
export type NewUser = typeof usersTable.$inferInsert; // For INSERT operations
export type Image = typeof imagesTable.$inferSelect; // For SELECT operations
export type NewImage = typeof imagesTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { 
  users: usersTable, 
  images: imagesTable 
};

export const tableRelations = {
  usersRelations,
  imagesRelations
};