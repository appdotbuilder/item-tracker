import { db } from '../db';
import { usersTable } from '../db/schema';
import { type RegisterUserInput, type AuthResponse } from '../schema';
import { eq, or } from 'drizzle-orm';
import crypto from 'crypto';

export const registerUser = async (input: RegisterUserInput): Promise<AuthResponse> => {
  try {
    // Check if email or username already exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(or(
        eq(usersTable.email, input.email),
        eq(usersTable.username, input.username)
      ))
      .execute();

    if (existingUser.length > 0) {
      const duplicateField = existingUser[0].email === input.email ? 'email' : 'username';
      throw new Error(`User with this ${duplicateField} already exists`);
    }

    // Hash the password using crypto.pbkdf2
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 10000;
    const keylen = 64;
    const digest = 'sha256';
    
    const hash = crypto.pbkdf2Sync(input.password, salt, iterations, keylen, digest).toString('hex');
    const passwordHash = `${salt}:${iterations}:${hash}`;

    // Create new user
    const result = await db.insert(usersTable)
      .values({
        email: input.email,
        username: input.username,
        password_hash: passwordHash
      })
      .returning()
      .execute();

    const newUser = result[0];

    // Return user data without password hash
    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      }
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
};

// Helper function to verify password (for future use)
export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const [salt, iterations, hash] = hashedPassword.split(':');
  const keylen = 64;
  const digest = 'sha256';
  
  const testHash = crypto.pbkdf2Sync(password, salt, parseInt(iterations), keylen, digest).toString('hex');
  return testHash === hash;
};