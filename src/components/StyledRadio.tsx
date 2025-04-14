import React from 'react';
import { Box, Radio, RadioProps, FormControlLabel } from '@mui/material';

interface StyledRadioProps extends RadioProps {
  label: string;
}

const StyledRadio: React.FC<StyledRadioProps> = ({ label, ...props }) => {
  return (
    <FormControlLabel
      value={label.toLowerCase().replace(' ', '-')}
      control={
        <Radio
          sx={{
            '&': {
              color: 'rgba(255, 255, 255, 0.3)',
            },
            '&.Mui-checked': {
              color: '#CDEA68',
            },
            '& .MuiSvgIcon-root': {
              fontSize: 24,
            },
          }}
          {...props}
        />
      }
      label={
        <Box
          component="span"
          sx={{
            color: props.checked ? '#CDEA68' : 'white',
            fontSize: '1rem',
            fontWeight: 500,
            transition: 'color 0.2s ease',
          }}
        >
          {label}
        </Box>
      }
      sx={{
        marginLeft: 0,
        marginRight: 0,
        '&:hover': {
          '& .MuiFormControlLabel-label': {
            color: '#CDEA68',
          },
        },
      }}
    />
  );
};

export default StyledRadio; 