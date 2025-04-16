import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ProfileCompletionAlertProps {
  missingFields: {
    level?: boolean;
    phone?: boolean;
    location?: boolean;
    sports?: boolean;
  };
  onOpenProfile: () => void;
}

const ProfileCompletionAlert: React.FC<ProfileCompletionAlertProps> = ({ missingFields, onOpenProfile }) => {
  // This component now always returns null as all notifications have been removed
  return null;
};

export default ProfileCompletionAlert; 