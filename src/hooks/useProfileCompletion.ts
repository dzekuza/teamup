import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

interface ProfileCompletionStatus {
  isLoading: boolean;
  missingFields: {
    level?: boolean;
    phone?: boolean;
    location?: boolean;
    sports?: boolean;
  };
}

export const useProfileCompletion = () => {
  const [status, setStatus] = useState<ProfileCompletionStatus>({
    isLoading: true,
    missingFields: {}
  });

  useEffect(() => {
    const checkProfileCompletion = async () => {
      const auth = getAuth();
      const db = getFirestore();

      if (!auth.currentUser) {
        setStatus({ isLoading: false, missingFields: {} });
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();

        if (!userData) {
          setStatus({ isLoading: false, missingFields: {} });
          return;
        }

        const missingFields = {
          level: !userData.level,
          phone: !userData.phone,
          location: !userData.location,
          sports: !userData.sports || userData.sports.length === 0
        };

        setStatus({
          isLoading: false,
          missingFields
        });
      } catch (error) {
        console.error('Error checking profile completion:', error);
        setStatus({ isLoading: false, missingFields: {} });
      }
    };

    checkProfileCompletion();
  }, []);

  return status;
};

export default useProfileCompletion; 