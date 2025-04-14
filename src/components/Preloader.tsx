import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import LogoWhite from '../assets/images/logo-white.svg';

const Preloader: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1A1A1A',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
      }}
    >
      <Box
        sx={{
          animation: 'bounce 1s infinite',
          '@keyframes bounce': {
            '0%, 100%': {
              transform: 'translateY(0)',
            },
            '50%': {
              transform: 'translateY(-20px)',
            },
          },
        }}
      >
        <img src={LogoWhite} alt="WebPadel Logo" style={{ width: '200px' }} />
      </Box>
      <CircularProgress
        sx={{
          color: '#CDEA68',
        }}
      />
    </Box>
  );
};

export default Preloader; 