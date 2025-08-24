import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createWorkspaceInputSchema,
  updateWorkspaceInputSchema,
  createStorageRoomInputSchema,
  updateStorageRoomInputSchema,
  createStorageLocationInputSchema,
  updateStorageLocationInputSchema,
  createItemInputSchema,
  updateItemInputSchema,
  searchInputSchema,
  idInputSchema,
  workspaceIdInputSchema,
  storageRoomIdInputSchema,
  storageLocationIdInputSchema
} from './schema';

// Import handlers
import { createWorkspace } from './handlers/create_workspace';
import { getWorkspaces } from './handlers/get_workspaces';
import { getWorkspace } from './handlers/get_workspace';
import { updateWorkspace } from './handlers/update_workspace';
import { deleteWorkspace } from './handlers/delete_workspace';

import { createStorageRoom } from './handlers/create_storage_room';
import { getStorageRooms } from './handlers/get_storage_rooms';
import { getStorageRoom } from './handlers/get_storage_room';
import { updateStorageRoom } from './handlers/update_storage_room';
import { deleteStorageRoom } from './handlers/delete_storage_room';

import { createStorageLocation } from './handlers/create_storage_location';
import { getStorageLocations } from './handlers/get_storage_locations';
import { getStorageLocation } from './handlers/get_storage_location';
import { updateStorageLocation } from './handlers/update_storage_location';
import { deleteStorageLocation } from './handlers/delete_storage_location';

import { createItem } from './handlers/create_item';
import { getItems } from './handlers/get_items';
import { getItem } from './handlers/get_item';
import { updateItem } from './handlers/update_item';
import { deleteItem } from './handlers/delete_item';

import { searchItems } from './handlers/search_items';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Workspace routes
  createWorkspace: publicProcedure
    .input(createWorkspaceInputSchema)
    .mutation(({ input }) => createWorkspace(input)),
  
  getWorkspaces: publicProcedure
    .query(() => getWorkspaces()),
  
  getWorkspace: publicProcedure
    .input(idInputSchema)
    .query(({ input }) => getWorkspace(input)),
  
  updateWorkspace: publicProcedure
    .input(updateWorkspaceInputSchema)
    .mutation(({ input }) => updateWorkspace(input)),
  
  deleteWorkspace: publicProcedure
    .input(idInputSchema)
    .mutation(({ input }) => deleteWorkspace(input)),

  // Storage Room routes
  createStorageRoom: publicProcedure
    .input(createStorageRoomInputSchema)
    .mutation(({ input }) => createStorageRoom(input)),
  
  getStorageRooms: publicProcedure
    .input(workspaceIdInputSchema)
    .query(({ input }) => getStorageRooms(input)),
  
  getStorageRoom: publicProcedure
    .input(idInputSchema)
    .query(({ input }) => getStorageRoom(input)),
  
  updateStorageRoom: publicProcedure
    .input(updateStorageRoomInputSchema)
    .mutation(({ input }) => updateStorageRoom(input)),
  
  deleteStorageRoom: publicProcedure
    .input(idInputSchema)
    .mutation(({ input }) => deleteStorageRoom(input)),

  // Storage Location routes
  createStorageLocation: publicProcedure
    .input(createStorageLocationInputSchema)
    .mutation(({ input }) => createStorageLocation(input)),
  
  getStorageLocations: publicProcedure
    .input(storageRoomIdInputSchema)
    .query(({ input }) => getStorageLocations(input)),
  
  getStorageLocation: publicProcedure
    .input(idInputSchema)
    .query(({ input }) => getStorageLocation(input)),
  
  updateStorageLocation: publicProcedure
    .input(updateStorageLocationInputSchema)
    .mutation(({ input }) => updateStorageLocation(input)),
  
  deleteStorageLocation: publicProcedure
    .input(idInputSchema)
    .mutation(({ input }) => deleteStorageLocation(input)),

  // Item routes
  createItem: publicProcedure
    .input(createItemInputSchema)
    .mutation(({ input }) => createItem(input)),
  
  getItems: publicProcedure
    .input(storageLocationIdInputSchema)
    .query(({ input }) => getItems(input)),
  
  getItem: publicProcedure
    .input(idInputSchema)
    .query(({ input }) => getItem(input)),
  
  updateItem: publicProcedure
    .input(updateItemInputSchema)
    .mutation(({ input }) => updateItem(input)),
  
  deleteItem: publicProcedure
    .input(idInputSchema)
    .mutation(({ input }) => deleteItem(input)),

  // Search route
  searchItems: publicProcedure
    .input(searchInputSchema)
    .query(({ input }) => searchItems(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();