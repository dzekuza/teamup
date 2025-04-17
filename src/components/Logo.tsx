import React from 'react';
import logoDark from '../assets/images/teamup-logo.svg';
import logoLight from '../assets/images/teamup-logo.svg';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  width = 117, 
  height = 120,
  variant = 'dark'
}) => {
  const logo = variant === 'dark' ? logoDark : logoLight;
  
  return (
    <img 
      src={logo} 
      alt="TeamUp Logo" 
      className={className}
      width={width}
      height={height}
    />
  );
};

export default Logo; 