import React, { Suspense } from 'react';

interface LazyLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A component that wraps lazy-loaded components with Suspense.
 * This provides a consistent loading experience across the app.
 */
const LazyLoader: React.FC<LazyLoaderProps> = ({ 
  children, 
  fallback = <div className="flex justify-center items-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C1FF2F]"></div>
  </div>
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

export default LazyLoader; 