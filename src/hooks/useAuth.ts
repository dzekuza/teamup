import { useState, useEffect } from 'react';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userFriends, setUserFriends] = useState<string[]>([]);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Ensure user data is stored in Firestore
      if (user) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0] || 'Unknown User',
            photoURL: user.photoURL || 'Avatar1',
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (error) {
          console.error('Error storing user data:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // Fetch user's friends when user changes
  useEffect(() => {
    const fetchUserFriends = async () => {
      if (!user) {
        setUserFriends([]);
        return;
      }

      try {
        const friendsQuery = query(
          collection(db, 'friends'),
          where('userId', '==', user.uid)
        );
        
        const friendsSnapshot = await getDocs(friendsQuery);
        
        if (!friendsSnapshot.empty) {
          const friendsData = friendsSnapshot.docs[0].data();
          setUserFriends(friendsData.friends || []);
        } else {
          setUserFriends([]);
        }
      } catch (error) {
        console.error('Error fetching user friends:', error);
        setUserFriends([]);
      }
    };

    fetchUserFriends();
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // User data will be stored in Firestore by the onAuthStateChanged listener
      return userCredential.user;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
        // User data will be stored in Firestore by the onAuthStateChanged listener
      }
      return userCredential.user;
    } catch (error) {
      console.error('Error registering:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // User data will be stored in Firestore by the onAuthStateChanged listener
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    userFriends,
    login,
    register,
    signInWithGoogle,
    signOut
  };
}; 