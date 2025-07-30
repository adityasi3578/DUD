import bcrypt from "bcryptjs";
import { storage } from "./storage";
import type { User } from "@shared/schema";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const user = await storage.getUserByEmail(email);
  
  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.password);
  
  if (!isValidPassword) {
    return null;
  }

  // Don't return password in the user object
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

export async function createUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<User> {
  const hashedPassword = await hashPassword(userData.password);
  
  const user = await storage.createUser({
    email: userData.email,
    password: hashedPassword,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: "USER",
    status: "PENDING"
  });

  // Don't return password in the user object
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}