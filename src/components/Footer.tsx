import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Container } from '@mui/material';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto', // Push footer to bottom
        backgroundColor: '#1E1E1E', // Match theme dark background
        borderTop: '1px solid #333',
        color: '#aaa', // Light grey text
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2">
            &copy; {currentYear} TeamUp. All rights reserved.
          </Typography>
          <Link
            to="/privacy-policy"
            className="text-gray-400 hover:text-[#C1FF2F] transition-colors duration-200"
          >
            Privacy Policy
          </Link>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 