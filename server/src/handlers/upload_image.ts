import { db } from '../db';
import { imagesTable, usersTable } from '../db/schema';
import { type UploadImageInput, type Image } from '../schema';
import { eq } from 'drizzle-orm';

export const uploadImage = async (input: UploadImageInput): Promise<Image> => {
  try {
    // 1. Validate that the user exists
    const userExists = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.user_id))
      .execute();

    if (userExists.length === 0) {
      throw new Error(`User with ID ${input.user_id} not found`);
    }

    // 2. Validate MIME type for images
    const validImageMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff'
    ];

    if (!validImageMimeTypes.includes(input.mime_type.toLowerCase())) {
      throw new Error(`Invalid image MIME type: ${input.mime_type}. Supported types: ${validImageMimeTypes.join(', ')}`);
    }

    // 3. Validate file size (reasonable limits - 50MB max)
    const maxFileSize = 50 * 1024 * 1024; // 50MB in bytes
    if (input.file_size > maxFileSize) {
      throw new Error(`File size ${input.file_size} bytes exceeds maximum allowed size of ${maxFileSize} bytes`);
    }

    if (input.file_size <= 0) {
      throw new Error('File size must be greater than 0');
    }

    // 4. Insert image record into database
    const result = await db.insert(imagesTable)
      .values({
        user_id: input.user_id,
        filename: input.filename,
        original_name: input.original_name,
        file_path: input.file_path,
        file_size: input.file_size,
        mime_type: input.mime_type
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};