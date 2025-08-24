import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imagesTable } from '../db/schema';
import { type DeleteImageInput } from '../schema';
import { deleteImage } from '../handlers/delete_image';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Test data
const testUser = {
  email: 'test@example.com',
  password_hash: 'hashed_password_123',
  username: 'testuser'
};

const testUser2 = {
  email: 'test2@example.com',
  password_hash: 'hashed_password_456',
  username: 'testuser2'
};

const testImage = {
  filename: 'test-image-123.jpg',
  original_name: 'my-photo.jpg',
  file_path: '/tmp/test-uploads/test-image-123.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg'
};

describe('deleteImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an image successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test image record
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        user_id: userId
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    // Create test input
    const input: DeleteImageInput = {
      image_id: imageId,
      user_id: userId
    };

    // Delete the image
    const result = await deleteImage(input);

    // Verify result
    expect(result.success).toBe(true);

    // Verify image was deleted from database
    const remainingImages = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, imageId))
      .execute();

    expect(remainingImages).toHaveLength(0);
  });

  it('should delete physical file when it exists', async () => {
    // Create test directory and file
    const testDir = '/tmp/test-delete-uploads';
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }

    const testFilePath = join(testDir, 'test-physical-file.jpg');
    await writeFile(testFilePath, 'test file content');

    // Verify file exists before test
    expect(existsSync(testFilePath)).toBe(true);

    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test image record with real file path
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        file_path: testFilePath,
        user_id: userId
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    // Delete the image
    const input: DeleteImageInput = {
      image_id: imageId,
      user_id: userId
    };

    const result = await deleteImage(input);

    // Verify success
    expect(result.success).toBe(true);

    // Verify physical file was deleted
    expect(existsSync(testFilePath)).toBe(false);
  });

  it('should fail when image does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    const input: DeleteImageInput = {
      image_id: 99999, // Non-existent image ID
      user_id: userId
    };

    await expect(deleteImage(input)).rejects.toThrow(/Image not found or you do not have permission/i);
  });

  it('should fail when user does not own the image', async () => {
    // Create two test users
    const userResult1 = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId1 = userResult1[0].id;

    const userResult2 = await db.insert(usersTable)
      .values(testUser2)
      .returning()
      .execute();
    const userId2 = userResult2[0].id;

    // Create image owned by user1
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        user_id: userId1
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    // Try to delete image as user2
    const input: DeleteImageInput = {
      image_id: imageId,
      user_id: userId2 // Different user
    };

    await expect(deleteImage(input)).rejects.toThrow(/Image not found or you do not have permission/i);

    // Verify image still exists in database
    const remainingImages = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, imageId))
      .execute();

    expect(remainingImages).toHaveLength(1);
  });

  it('should succeed even when physical file does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test image record with non-existent file path
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        file_path: '/tmp/non-existent/file.jpg',
        user_id: userId
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    const input: DeleteImageInput = {
      image_id: imageId,
      user_id: userId
    };

    // Should not throw even though physical file doesn't exist
    const result = await deleteImage(input);
    expect(result.success).toBe(true);

    // Verify database record was still deleted
    const remainingImages = await db.select()
      .from(imagesTable)
      .where(eq(imagesTable.id, imageId))
      .execute();

    expect(remainingImages).toHaveLength(0);
  });

  it('should verify foreign key constraint with user_id', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test image
    const imageResult = await db.insert(imagesTable)
      .values({
        ...testImage,
        user_id: userId
      })
      .returning()
      .execute();
    const imageId = imageResult[0].id;

    // Try to delete with invalid user_id
    const input: DeleteImageInput = {
      image_id: imageId,
      user_id: 99999 // Non-existent user
    };

    await expect(deleteImage(input)).rejects.toThrow(/Image not found or you do not have permission/i);
  });
});