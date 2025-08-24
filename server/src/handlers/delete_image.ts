import { db } from '../db';
import { imagesTable } from '../db/schema';
import { type DeleteImageInput } from '../schema';
import { eq, and } from 'drizzle-orm';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

export async function deleteImage(input: DeleteImageInput): Promise<{ success: boolean }> {
  try {
    // First, find the image record and verify ownership
    const imageRecords = await db.select()
      .from(imagesTable)
      .where(
        and(
          eq(imagesTable.id, input.image_id),
          eq(imagesTable.user_id, input.user_id)
        )
      )
      .execute();

    if (imageRecords.length === 0) {
      throw new Error('Image not found or you do not have permission to delete it');
    }

    const imageRecord = imageRecords[0];

    // Try to delete the physical file if it exists
    try {
      if (existsSync(imageRecord.file_path)) {
        await unlink(imageRecord.file_path);
      }
    } catch (fileError) {
      // Log file deletion error but don't fail the database operation
      console.error('Failed to delete physical file:', fileError);
    }

    // Delete the image record from the database
    const deleteResult = await db.delete(imagesTable)
      .where(
        and(
          eq(imagesTable.id, input.image_id),
          eq(imagesTable.user_id, input.user_id)
        )
      )
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Image deletion failed:', error);
    throw error;
  }
}