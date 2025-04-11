import React from 'react';
import logoDark from '../assets/images/logo.svg';
import logoLight from '../assets/images/logo-white.svg';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: 'dark' | 'light';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  width = 224, 
  height = 246,
  variant = 'dark'
}) => {
  const logo = variant === 'dark' ? logoDark : logoLight;
  
  return (
    <img 
      src={logo} 
      alt="WebPadel Logo" 
      className={className}
      width={width}
      height={height}
    />
  );
};

export default Logo; 