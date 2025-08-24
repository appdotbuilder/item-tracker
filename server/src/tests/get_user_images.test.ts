import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, imagesTable } from '../db/schema';
import { type GetUserImagesInput } from '../schema';
import { getUserImages } from '../handlers/get_user_images';

describe('getUserImages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no images', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        username: 'testuser'
      })
      .returning()
      .execute();

    const user = userResult[0];

    const input: GetUserImagesInput = {
      user_id: user.id
    };

    const result = await getUserImages(input);

    expect(result).toEqual([]);
  });

  it('should return user images ordered by creation date (newest first)', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        username: 'testuser'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test images with different creation times
    const image1 = await db.insert(imagesTable)
      .values({
        user_id: user.id,
        filename: 'image1.jpg',
        original_name: 'photo1.jpg',
        file_path: '/uploads/image1.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg'
      })
      .returning()
      .execute();

    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const image2 = await db.insert(imagesTable)
      .values({
        user_id: user.id,
        filename: 'image2.png',
        original_name: 'photo2.png',
        file_path: '/uploads/image2.png',
        file_size: 2048,
        mime_type: 'image/png'
      })
      .returning()
      .execute();

    const input: GetUserImagesInput = {
      user_id: user.id
    };

    const result = await getUserImages(input);

    expect(result).toHaveLength(2);
    
    // Verify images are ordered by creation date (newest first)
    expect(result[0].id).toEqual(image2[0].id);
    expect(result[1].id).toEqual(image1[0].id);
    
    // Verify first image details
    expect(result[0].filename).toEqual('image2.png');
    expect(result[0].original_name).toEqual('photo2.png');
    expect(result[0].file_path).toEqual('/uploads/image2.png');
    expect(result[0].file_size).toEqual(2048);
    expect(result[0].mime_type).toEqual('image/png');
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second image details
    expect(result[1].filename).toEqual('image1.jpg');
    expect(result[1].original_name).toEqual('photo1.jpg');
    expect(result[1].file_path).toEqual('/uploads/image1.jpg');
    expect(result[1].file_size).toEqual(1024);
    expect(result[1].mime_type).toEqual('image/jpeg');
    expect(result[1].user_id).toEqual(user.id);
    expect(result[1].created_at).toBeInstanceOf(Date);
    
    // Verify ordering - newer image should have later timestamp
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should only return images for the specified user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        password_hash: 'hashed_password1',
        username: 'user1'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        password_hash: 'hashed_password2',
        username: 'user2'
      })
      .returning()
      .execute();

    const user1 = user1Result[0];
    const user2 = user2Result[0];

    // Create images for both users
    await db.insert(imagesTable)
      .values({
        user_id: user1.id,
        filename: 'user1_image.jpg',
        original_name: 'user1_photo.jpg',
        file_path: '/uploads/user1_image.jpg',
        file_size: 1024,
        mime_type: 'image/jpeg'
      })
      .execute();

    await db.insert(imagesTable)
      .values({
        user_id: user2.id,
        filename: 'user2_image.png',
        original_name: 'user2_photo.png',
        file_path: '/uploads/user2_image.png',
        file_size: 2048,
        mime_type: 'image/png'
      })
      .execute();

    const input: GetUserImagesInput = {
      user_id: user1.id
    };

    const result = await getUserImages(input);

    expect(result).toHaveLength(1);
    expect(result[0].filename).toEqual('user1_image.jpg');
    expect(result[0].user_id).toEqual(user1.id);
  });

  it('should throw error for non-existent user', async () => {
    const input: GetUserImagesInput = {
      user_id: 999999 // Non-existent user ID
    };

    await expect(getUserImages(input)).rejects.toThrow(/User with id 999999 not found/i);
  });

  it('should handle multiple images with same timestamps correctly', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        username: 'testuser'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create multiple images in quick succession
    await db.insert(imagesTable)
      .values([
        {
          user_id: user.id,
          filename: 'batch1.jpg',
          original_name: 'batch1.jpg',
          file_path: '/uploads/batch1.jpg',
          file_size: 1000,
          mime_type: 'image/jpeg'
        },
        {
          user_id: user.id,
          filename: 'batch2.jpg',
          original_name: 'batch2.jpg',
          file_path: '/uploads/batch2.jpg',
          file_size: 2000,
          mime_type: 'image/jpeg'
        },
        {
          user_id: user.id,
          filename: 'batch3.jpg',
          original_name: 'batch3.jpg',
          file_path: '/uploads/batch3.jpg',
          file_size: 3000,
          mime_type: 'image/jpeg'
        }
      ])
      .execute();

    const input: GetUserImagesInput = {
      user_id: user.id
    };

    const result = await getUserImages(input);

    expect(result).toHaveLength(3);
    
    // All images should belong to the correct user
    result.forEach(image => {
      expect(image.user_id).toEqual(user.id);
      expect(image.created_at).toBeInstanceOf(Date);
    });

    // Verify all expected filenames are present
    const filenames = result.map(img => img.filename).sort();
    expect(filenames).toEqual(['batch1.jpg', 'batch2.jpg', 'batch3.jpg']);
  });
});