import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type Image } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getImage = async (imageId: number, userId: number): Promise<Image | null> => {
  try {
    // Query for the image with both ID and user ownership validation
    const results = await db.select()
      .from(imagesTable)
      .where(and(
        eq(imagesTable.id, imageId),
        eq(imagesTable.user_id, userId)
      ))
      .limit(1)
      .execute();

    // Return the image if found, null otherwise
    if (results.length === 0) {
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Get image failed:', error);
    throw error;
  }
};