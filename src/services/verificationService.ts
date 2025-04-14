import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import crypto from 'crypto';

// Generate a secure random token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Store verification token in Firestore
export const createVerificationToken = async (userId: string, email: string) => {
  const token = generateVerificationToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // Token expires in 24 hours

  await setDoc(doc(db, 'emailVerifications', token), {
    userId,
    email,
    createdAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    used: false
  });

  return token;
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