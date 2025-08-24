import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput } from '../schema';
import { registerUser, verifyPassword } from '../handlers/register_user';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: RegisterUserInput = {
  email: 'test@example.com',
  password: 'securePassword123',
  username: 'testuser'
};

const secondInput: RegisterUserInput = {
  email: 'test2@example.com',
  password: 'anotherPassword456',
  username: 'testuser2'
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user successfully', async () => {
    const result = await registerUser(testInput);

    // Verify response structure
    expect(result.user.email).toEqual('test@example.com');
    expect(result.user.username).toEqual('testuser');
    expect(result.user.id).toBeDefined();
    expect(typeof result.user.id).toBe('number');
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
    
    // Verify password hash is not included in response
    expect(result.user).not.toHaveProperty('password_hash');
    expect(result.user).not.toHaveProperty('password');
  });

  it('should save user to database with hashed password', async () => {
    const result = await registerUser(testInput);

    // Query database to verify user was created
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    
    expect(savedUser.email).toEqual('test@example.com');
    expect(savedUser.username).toEqual('testuser');
    expect(savedUser.password_hash).toBeDefined();
    expect(savedUser.password_hash).not.toEqual('securePassword123'); // Should be hashed
    expect(savedUser.created_at).toBeInstanceOf(Date);
    expect(savedUser.updated_at).toBeInstanceOf(Date);

    // Verify password was hashed correctly using our verify function
    const passwordMatches = verifyPassword('securePassword123', savedUser.password_hash);
    expect(passwordMatches).toBe(true);

    // Verify wrong password doesn't match
    const wrongPasswordMatches = verifyPassword('wrongPassword', savedUser.password_hash);
    expect(wrongPasswordMatches).toBe(false);
  });

  it('should reject duplicate email', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register second user with same email
    const duplicateEmailInput = {
      ...secondInput,
      email: 'test@example.com' // Same email as first user
    };

    await expect(registerUser(duplicateEmailInput))
      .rejects.toThrow(/email already exists/i);
  });

  it('should reject duplicate username', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register second user with same username
    const duplicateUsernameInput = {
      ...secondInput,
      username: 'testuser' // Same username as first user
    };

    await expect(registerUser(duplicateUsernameInput))
      .rejects.toThrow(/username already exists/i);
  });

  it('should allow multiple users with different credentials', async () => {
    // Register first user
    const result1 = await registerUser(testInput);
    
    // Register second user with different credentials
    const result2 = await registerUser(secondInput);

    // Both should succeed
    expect(result1.user.id).not.toEqual(result2.user.id);
    expect(result1.user.email).toEqual('test@example.com');
    expect(result2.user.email).toEqual('test2@example.com');
    expect(result1.user.username).toEqual('testuser');
    expect(result2.user.username).toEqual('testuser2');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should create unique password hashes for same password', async () => {
    // Register first user
    await registerUser(testInput);

    // Create another input with same password but different email/username
    const samePasswordInput = {
      email: 'different@example.com',
      username: 'differentuser',
      password: 'securePassword123' // Same password
    };

    await registerUser(samePasswordInput);

    // Get both users
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);

    // Verify hashes are different (due to different salts)
    expect(allUsers[0].password_hash).not.toEqual(allUsers[1].password_hash);

    // But both should verify correctly with the same password
    expect(verifyPassword('securePassword123', allUsers[0].password_hash)).toBe(true);
    expect(verifyPassword('securePassword123', allUsers[1].password_hash)).toBe(true);
  });

  it('should handle case-sensitive email uniqueness', async () => {
    // Register with lowercase email
    await registerUser(testInput);

    // Try to register with uppercase email
    const uppercaseEmailInput = {
      ...secondInput,
      email: 'TEST2@EXAMPLE.COM'
    };

    const result = await registerUser(uppercaseEmailInput);
    expect(result.user.email).toEqual('TEST2@EXAMPLE.COM');
    
    // Verify both users exist
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });
});