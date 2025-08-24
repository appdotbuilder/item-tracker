import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imagesTable } from '../db/schema';
import { type UploadImageInput } from '../schema';
import { uploadImage } from '../handlers/upload_image';
import { eq } from 'drizzle-orm';

// Helper function to create a test user
const createTestUser = async () => {
  const result = await db.insert(usersTable)
    .values({
      email: 'test@example.com',
      password_hash: 'hashed_password',
      username: 'testuser'
    })
    .returning()
    .execute();
  
  return result[0];
};

// Valid test input
const createTestInput = (user_id: number): UploadImageInput => ({
  user_id,
  filename: 'unique_image_123.jpg',
  original_name: 'my_photo.jpg',
  file_path: '/uploads/images/unique_image_123.jpg',
  file_size: 1024000, // 1MB
  mime_type: 'image/jpeg'
});

describe('uploadImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should upload an image successfully', async () => {
    const user = await createTestUser();
    const input = createTestInput(user.id);

    const result = await uploadImage(input);

    // Validate returned image data
    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(user.id);
    expect(result.filename).toEqual('unique_image_123.jpg');
    expect(result.original_name).toEqual('my_photo.jpg');
    expect(result.file_path).toEqual('/uploads/images/unique_image_123.jpg');
    expect(result.file_size).toEqual(1024000);
    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save image record to database', async () => {
    const user = await createTestUser();
    const input = createTestInput(user.id);

    const result = await uploadImage(input);

    // Verify image was saved to database
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, result.id))
      .execute();

    expect(images).toHaveLength(1);
    expect(images[0].user_id).toEqual(user.id);
    expect(images[0].filename).toEqual('unique_image_123.jpg');
    expect(images[0].original_name).toEqual('my_photo.jpg');
    expect(images[0].file_path).toEqual('/uploads/images/unique_image_123.jpg');
    expect(images[0].file_size).toEqual(1024000);
    expect(images[0].mime_type).toEqual('image/jpeg');
    expect(images[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const input = createTestInput(999); // Non-existent user ID

    await expect(uploadImage(input)).rejects.toThrow(/User with ID 999 not found/i);
  });

  it('should accept various valid image MIME types', async () => {
    const user = await createTestUser();
    const validMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/bmp',
      'image/tiff'
    ];

    for (const mimeType of validMimeTypes) {
      const input = {
        ...createTestInput(user.id),
        filename: `test_${mimeType.split('/')[1]}.${mimeType.split('/')[1]}`,
        mime_type: mimeType
      };

      const result = await uploadImage(input);
      expect(result.mime_type).toEqual(mimeType);
    }
  });

  it('should handle case-insensitive MIME type validation', async () => {
    const user = await createTestUser();
    const input = {
      ...createTestInput(user.id),
      mime_type: 'IMAGE/JPEG' // Uppercase
    };

    const result = await uploadImage(input);
    expect(result.mime_type).toEqual('IMAGE/JPEG');
  });

  it('should reject invalid MIME types', async () => {
    const user = await createTestUser();
    const invalidMimeTypes = [
      'text/plain',
      'application/pdf',
      'video/mp4',
      'audio/mp3',
      'application/json'
    ];

    for (const mimeType of invalidMimeTypes) {
      const input = {
        ...createTestInput(user.id),
        mime_type: mimeType
      };

      await expect(uploadImage(input)).rejects.toThrow(/Invalid image MIME type/i);
    }
  });

  it('should reject files exceeding maximum size limit', async () => {
    const user = await createTestUser();
    const input = {
      ...createTestInput(user.id),
      file_size: 51 * 1024 * 1024 // 51MB - exceeds 50MB limit
    };

    await expect(uploadImage(input)).rejects.toThrow(/exceeds maximum allowed size/i);
  });

  it('should reject files with zero or negative size', async () => {
    const user = await createTestUser();
    
    // Test zero file size
    const zeroSizeInput = {
      ...createTestInput(user.id),
      file_size: 0
    };

    await expect(uploadImage(zeroSizeInput)).rejects.toThrow(/File size must be greater than 0/i);

    // Test negative file size
    const negativeSizeInput = {
      ...createTestInput(user.id),
      file_size: -1024
    };

    await expect(uploadImage(negativeSizeInput)).rejects.toThrow(/File size must be greater than 0/i);
  });

  it('should handle maximum allowed file size correctly', async () => {
    const user = await createTestUser();
    const input = {
      ...createTestInput(user.id),
      file_size: 50 * 1024 * 1024 // Exactly 50MB - should be allowed
    };

    const result = await uploadImage(input);
    expect(result.file_size).toEqual(50 * 1024 * 1024);
  });

  it('should allow multiple images for the same user', async () => {
    const user = await createTestUser();
    
    // Upload first image
    const input1 = createTestInput(user.id);
    const result1 = await uploadImage(input1);

    // Upload second image with different filename
    const input2 = {
      ...createTestInput(user.id),
      filename: 'another_image_456.png',
      original_name: 'another_photo.png',
      file_path: '/uploads/images/another_image_456.png',
      mime_type: 'image/png'
    };
    const result2 = await uploadImage(input2);

    // Verify both images exist
    const images = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.user_id, user.id))
      .execute();

    expect(images).toHaveLength(2);
    expect([result1.id, result2.id]).toContain(images[0].id);
    expect([result1.id, result2.id]).toContain(images[1].id);
  });
});