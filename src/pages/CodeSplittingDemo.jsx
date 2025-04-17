import React, { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';

// Lazy load the example component to demonstrate code splitting
const CodeSplittingExample = lazy(() => 
  import('../examples/CodeSplittingExample').then(module => ({ 
    default: module.CodeSplittingExample || module.default 
  }))
);

/**
 * This page demonstrates code splitting in React.
 * The actual example component is loaded lazily.
 */
const CodeSplittingDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0F0F0F] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Code Splitting Demo</h1>
          <Link 
            to="/"
            className="bg-[#333333] hover:bg-[#444444] text-white py-2 px-4 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
        
        <Suspense 
          fallback={
            <div className="bg-[#1A1A1A] rounded-xl p-12 flex justify-center items-center">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#C1FF2F] mb-4"></div>
                <p className="text-gray-300">Loading code splitting example...</p>
              </div>
            </div>
          }
        >
          <CodeSplittingExample />
        </Suspense>
      </div>
    </div>
  );
};

export default CodeSplittingDemo; 