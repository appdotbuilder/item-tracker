import { db } from '../db';
import { imagesTable, usersTable } from '../db/schema';
import { type GetUserImagesInput, type Image } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getUserImages = async (input: GetUserImagesInput): Promise<Image[]> => {
  try {
    // First verify that the user exists
    const userExists = await db.select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .limit(1)
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with id ${input.user_id} not found`);
    }

    // Fetch all images for the user, ordered by creation date (newest first)
    const results = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.user_id, input.user_id))
      .orderBy(desc(imagesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user images:', error);
    throw error;
  }
};