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
  const getMissingFieldMessage = () => {
    if (missingFields.level) {
      return {
        message: "Please set your skill level to start creating or joining events",
        action: "Set level"
      };
    }
    if (missingFields.sports) {
      return {
        message: "Select your favorite sports to get started",
        action: "Select sports"
      };
    }
    if (missingFields.location) {
      return {
        message: "Add your location to find events near you",
        action: "Add location"
      };
    }
    if (missingFields.phone) {
      return {
        message: "Add your phone number to enable communication with other players",
        action: "Add phone"
      };
    }
    return null;
  };

  const messageData = getMissingFieldMessage();

  if (!messageData) return null;

  return (
    <Box
      sx={{
        backgroundColor: '#1E1E1E',
        borderRadius: '12px',
        p: 3,
        mb: 3,
        border: '1px solid #2A2A2A',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography
          sx={{
            color: 'white',
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          {messageData.message}
        </Typography>
        <Button
          onClick={onOpenProfile}
          sx={{
            backgroundColor: '#CDEA68',
            color: 'black',
            px: 4,
            py: 1,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: '#b8d454',
            },
            whiteSpace: 'nowrap',
          }}
        >
          {messageData.action}
        </Button>
      </Box>
    </Box>
  );
};

export default ProfileCompletionAlert; 