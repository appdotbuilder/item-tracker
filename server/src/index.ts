import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  registerUserInputSchema,
  loginUserInputSchema,
  uploadImageInputSchema,
  getUserImagesInputSchema,
  deleteImageInputSchema
} from './schema';

// Import handlers
import { registerUser } from './handlers/register_user';
import { loginUser } from './handlers/login_user';
import { uploadImage } from './handlers/upload_image';
import { getUserImages } from './handlers/get_user_images';
import { deleteImage } from './handlers/delete_image';
import { getImage } from './handlers/get_image';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  registerUser: publicProcedure
    .input(registerUserInputSchema)
    .mutation(({ input }) => registerUser(input)),

  loginUser: publicProcedure
    .input(loginUserInputSchema)
    .mutation(({ input }) => loginUser(input)),

  // Image management routes
  uploadImage: publicProcedure
    .input(uploadImageInputSchema)
    .mutation(({ input }) => uploadImage(input)),

  getUserImages: publicProcedure
    .input(getUserImagesInputSchema)
    .query(({ input }) => getUserImages(input)),

  getImage: publicProcedure
    .input(z.object({
      imageId: z.number(),
      userId: z.number()
    }))
    .query(({ input }) => getImage(input.imageId, input.userId)),

  deleteImage: publicProcedure
    .input(deleteImageInputSchema)
    .mutation(({ input }) => deleteImage(input))
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