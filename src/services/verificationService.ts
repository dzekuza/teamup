import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Generate a simple random token without using crypto
const generateVerificationToken = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Store verification token in Firestore
export const createVerificationToken = async (userId: string, email: string): Promise<string> => {
  try {
    // Create a random token
    const token = generateVerificationToken();
    
    // Store the token in Firestore with an expiry time (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);
    
    await setDoc(doc(db, 'verificationTokens', token), {
      userId,
      email,
      expiresAt: expiresAt.toISOString(),
      used: false
    });
    
    return token;
  } catch (error) {
    console.error('Error creating verification token:', error);
    throw error;
  }
};

// Verify token and mark user as verified
export const verifyToken = async (token: string): Promise<{ valid: boolean; userId?: string; email?: string }> => {
  try {
    const tokenDoc = await getDoc(doc(db, 'verificationTokens', token));
    
    if (!tokenDoc.exists()) {
      return { valid: false };
    }
    
    const tokenData = tokenDoc.data();
    const expiresAt = new Date(tokenData.expiresAt);
    const now = new Date();
    
    if (expiresAt < now || tokenData.used) {
      return { valid: false };
    }
    
    // Mark token as used
    await setDoc(doc(db, 'verificationTokens', token), {
      ...tokenData,
      used: true
    }, { merge: true });
    
    return {
      valid: true,
      userId: tokenData.userId,
      email: tokenData.email
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    return { valid: false };
  }
};

// Verify token and mark user as verified
export const verifyEmail = async (token: string) => {
  const verificationDoc = await getDoc(doc(db, 'emailVerifications', token));
  
  if (!verificationDoc.exists()) {
    throw new Error('Invalid verification token');
  }

  const verification = verificationDoc.data();
  const now = new Date();
  const expiresAt = new Date(verification.expiresAt);

  if (now > expiresAt) {
    throw new Error('Verification token has expired');
  }

  if (verification.used) {
    throw new Error('Verification token has already been used');
  }

  // Mark user as verified in Firestore
  await updateDoc(doc(db, 'users', verification.userId), {
    emailVerified: true,
    verifiedAt: new Date().toISOString()
  });

  // Mark token as used
  await updateDoc(doc(db, 'emailVerifications', token), {
    used: true,
    usedAt: new Date().toISOString()
  });

  return verification.userId;
}; 