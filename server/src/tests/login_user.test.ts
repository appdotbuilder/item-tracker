import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginUserInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { eq } from 'drizzle-orm';

// Simple password hash function (matching the one in handler)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simple token decoder for testing
function decodeToken(token: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  const payload = JSON.parse(atob(parts[1]));
  return payload;
}

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testPassword = 'testpassword123';

  // Helper function to create a test user
  async function createTestUser(): Promise<number> {
    const passwordHash = await hashPassword(testPassword);
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: passwordHash,
        username: 'testuser'
      })
      .returning()
      .execute();
    
    return users[0].id;
  }

  const validLoginInput: LoginUserInput = {
    email: 'test@example.com',
    password: testPassword
  };

  it('should successfully login with valid credentials', async () => {
    const testUserId = await createTestUser();
    const result = await loginUser(validLoginInput);

    // Verify user data is returned correctly
    expect(result.user.id).toEqual(testUserId);
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.username).toEqual('testuser');
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);

    // Verify token is generated
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');

    // Verify token contains correct data
    const decoded = decodeToken(result.token!);
    expect(decoded.userId).toEqual(testUserId);
    expect(decoded.email).toEqual('test@example.com');
    expect(decoded.exp).toBeDefined(); // Token should have expiration
  });

  it('should throw error for non-existent email', async () => {
    const invalidInput: LoginUserInput = {
      email: 'nonexistent@example.com',
      password: testPassword
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for incorrect password', async () => {
    await createTestUser();
    const invalidInput: LoginUserInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should not return password hash in response', async () => {
    await createTestUser();
    const result = await loginUser(validLoginInput);

    // Ensure password_hash is not included in the response
    expect((result.user as any).password_hash).toBeUndefined();
  });

  it('should generate different tokens for subsequent logins', async () => {
    await createTestUser();
    const result1 = await loginUser(validLoginInput);
    
    // Wait a moment to ensure different timestamps and random values
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result2 = await loginUser(validLoginInput);

    expect(result1.token).not.toEqual(result2.token);
    
    // Both tokens should contain the same user data
    const decoded1 = decodeToken(result1.token!);
    const decoded2 = decodeToken(result2.token!);
    
    expect(decoded1.userId).toEqual(decoded2.userId);
    expect(decoded1.email).toEqual(decoded2.email);
  });

  it('should handle case-sensitive email correctly', async () => {
    await createTestUser();
    const uppercaseEmailInput: LoginUserInput = {
      email: 'TEST@EXAMPLE.COM',
      password: testPassword
    };

    // Should fail because email is case-sensitive in our implementation
    await expect(loginUser(uppercaseEmailInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should verify token expiration is set correctly', async () => {
    await createTestUser();
    const result = await loginUser(validLoginInput);
    
    const decoded = decodeToken(result.token!);
    const now = Math.floor(Date.now() / 1000);
    const expectedExpiry = now + (24 * 60 * 60); // 24 hours from now
    
    // Allow 5 seconds tolerance for test execution time
    expect(decoded.exp).toBeGreaterThan(now);
    expect(decoded.exp).toBeLessThanOrEqual(expectedExpiry + 5);
  });

  it('should verify password hashing works correctly', async () => {
    // Test that same password produces same hash
    const hash1 = await hashPassword('testpass');
    const hash2 = await hashPassword('testpass');
    expect(hash1).toEqual(hash2);

    // Test that different passwords produce different hashes
    const hash3 = await hashPassword('differentpass');
    expect(hash1).not.toEqual(hash3);
  });

  it('should save user correctly in database', async () => {
    const testUserId = await createTestUser();
    const result = await loginUser(validLoginInput);

    // Verify user exists in database with correct data
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].id).toEqual(testUserId);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].username).toEqual('testuser');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });
});