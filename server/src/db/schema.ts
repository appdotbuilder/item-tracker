import { serial, text, pgTable, timestamp, integer, foreignKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Workspaces table
export const workspacesTable = pgTable('workspaces', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Storage rooms table
export const storageRoomsTable = pgTable('storage_rooms', {
  id: serial('id').primaryKey(),
  workspace_id: integer('workspace_id').notNull(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  workspaceFk: foreignKey({
    columns: [table.workspace_id],
    foreignColumns: [workspacesTable.id],
  })
}));

// Storage locations table
export const storageLocationsTable = pgTable('storage_locations', {
  id: serial('id').primaryKey(),
  storage_room_id: integer('storage_room_id').notNull(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default
  location_type: text('location_type'), // e.g., "Box", "Dresser", "Closet"
  image_url: text('image_url'), // Nullable for uploaded images
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  storageRoomFk: foreignKey({
    columns: [table.storage_room_id],
    foreignColumns: [storageRoomsTable.id],
  })
}));

// Items table
export const itemsTable = pgTable('items', {
  id: serial('id').primaryKey(),
  storage_location_id: integer('storage_location_id').notNull(),
  description: text('description').notNull(),
  color: text('color'), // Nullable by default
  quantity: integer('quantity').notNull().default(1),
  location_within_room: text('location_within_room'), // e.g., "Top shelf", "Bottom drawer"
  image_url: text('image_url'), // Nullable for uploaded images
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  storageLocationFk: foreignKey({
    columns: [table.storage_location_id],
    foreignColumns: [storageLocationsTable.id],
  })
}));

// Relations
export const workspacesRelations = relations(workspacesTable, ({ many }) => ({
  storageRooms: many(storageRoomsTable),
}));

export const storageRoomsRelations = relations(storageRoomsTable, ({ one, many }) => ({
  workspace: one(workspacesTable, {
    fields: [storageRoomsTable.workspace_id],
    references: [workspacesTable.id],
  }),
  storageLocations: many(storageLocationsTable),
}));

export const storageLocationsRelations = relations(storageLocationsTable, ({ one, many }) => ({
  storageRoom: one(storageRoomsTable, {
    fields: [storageLocationsTable.storage_room_id],
    references: [storageRoomsTable.id],
  }),
  items: many(itemsTable),
}));

export const itemsRelations = relations(itemsTable, ({ one }) => ({
  storageLocation: one(storageLocationsTable, {
    fields: [itemsTable.storage_location_id],
    references: [storageLocationsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Workspace = typeof workspacesTable.$inferSelect;
export type NewWorkspace = typeof workspacesTable.$inferInsert;

export type StorageRoom = typeof storageRoomsTable.$inferSelect;
export type NewStorageRoom = typeof storageRoomsTable.$inferInsert;

export type StorageLocation = typeof storageLocationsTable.$inferSelect;
export type NewStorageLocation = typeof storageLocationsTable.$inferInsert;

export type Item = typeof itemsTable.$inferSelect;
export type NewItem = typeof itemsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  workspaces: workspacesTable,
  storageRooms: storageRoomsTable,
  storageLocations: storageLocationsTable,
  items: itemsTable
};

export const relationshipTables = {
  workspacesRelations,
  storageRoomsRelations,
  storageLocationsRelations,
  itemsRelations
};