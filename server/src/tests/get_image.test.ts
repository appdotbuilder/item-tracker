import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imagesTable } from '../db/schema';
import { getImage } from '../handlers/get_image';

describe('getImage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return image when user owns the image', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        username: 'testuser'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test image
    const imageResult = await db.insert(imagesTable)
      .values({
        user_id: userId,
        filename: 'test-image-123.jpg',
        original_name: 'my-photo.jpg',
        file_path: '/uploads/test-image-123.jpg',
        file_size: 2048000,
        mime_type: 'image/jpeg'
      })
      .returning()
      .execute();

    const imageId = imageResult[0].id;

    // Get the image
    const result = await getImage(imageId, userId);

    // Verify the result
    expect(result).toBeDefined();
    expect(result!.id).toEqual(imageId);
    expect(result!.user_id).toEqual(userId);
    expect(result!.filename).toEqual('test-image-123.jpg');
    expect(result!.original_name).toEqual('my-photo.jpg');
    expect(result!.file_path).toEqual('/uploads/test-image-123.jpg');
    expect(result!.file_size).toEqual(2048000);
    expect(result!.mime_type).toEqual('image/jpeg');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null when image does not exist', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        username: 'testuser'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const nonExistentImageId = 99999;

    // Try to get non-existent image
    const result = await getImage(nonExistentImageId, userId);

    // Should return null
    expect(result).toBeNull();
  });

  it('should return null when user does not own the image', async () => {
    // Create first test user
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password',
        username: 'user1'
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;

    // Create second test user
    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password',
        username: 'user2'
      })
      .returning()
      .execute();

    const user2Id = user2Result[0].id;

    // Create image owned by user1
    const imageResult = await db.insert(imagesTable)
      .values({
        user_id: user1Id,
        filename: 'user1-image.jpg',
        original_name: 'secret-photo.jpg',
        file_path: '/uploads/user1-image.jpg',
        file_size: 1500000,
        mime_type: 'image/jpeg'
      })
      .returning()
      .execute();

    const imageId = imageResult[0].id;

    // Try to get user1's image as user2
    const result = await getImage(imageId, user2Id);

    // Should return null (authorization failure)
    expect(result).toBeNull();
  });

  it('should handle different image types correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        username: 'testuser'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create PNG image
    const pngResult = await db.insert(imagesTable)
      .values({
        user_id: userId,
        filename: 'test-image.png',
        original_name: 'screenshot.png',
        file_path: '/uploads/test-image.png',
        file_size: 512000,
        mime_type: 'image/png'
      })
      .returning()
      .execute();

    const pngId = pngResult[0].id;

    // Get the PNG image
    const pngImage = await getImage(pngId, userId);

    // Verify PNG image details
    expect(pngImage).toBeDefined();
    expect(pngImage!.mime_type).toEqual('image/png');
    expect(pngImage!.original_name).toEqual('screenshot.png');
    expect(pngImage!.file_size).toEqual(512000);
  });

  it('should return correct image when user has multiple images', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        username: 'testuser'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create multiple images
    const image1Result = await db.insert(imagesTable)
      .values({
        user_id: userId,
        filename: 'image1.jpg',
        original_name: 'first-photo.jpg',
        file_path: '/uploads/image1.jpg',
        file_size: 1000000,
        mime_type: 'image/jpeg'
      })
      .returning()
      .execute();

    const image2Result = await db.insert(imagesTable)
      .values({
        user_id: userId,
        filename: 'image2.png',
        original_name: 'second-photo.png',
        file_path: '/uploads/image2.png',
        file_size: 2000000,
        mime_type: 'image/png'
      })
      .returning()
      .execute();

    // Get the second image specifically
    const result = await getImage(image2Result[0].id, userId);

    // Should return the correct image (image2)
    expect(result).toBeDefined();
    expect(result!.id).toEqual(image2Result[0].id);
    expect(result!.filename).toEqual('image2.png');
    expect(result!.original_name).toEqual('second-photo.png');
    expect(result!.mime_type).toEqual('image/png');
    expect(result!.file_size).toEqual(2000000);
  });
});