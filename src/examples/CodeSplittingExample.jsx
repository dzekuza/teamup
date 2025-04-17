import React, { lazy, Suspense, useState } from 'react';

// Example of lazy loading components
const LazyLoadedComponent = lazy(() => import('./LazyLoadedComponent'));
const LazyDialog = lazy(() => import('../components/CreateEventDialog').then(module => ({
  default: module.CreateEventDialog || module.default
})));

/**
 * This is an example component demonstrating React code splitting using lazy and Suspense
 * 
 * Code splitting allows you to:
 * 1. Reduce the initial bundle size of your application
 * 2. Load components on demand when they are needed
 * 3. Improve initial page load performance
 * 
 * Based on: https://create-react-app.dev/docs/code-splitting/
 */
const CodeSplittingExample = () => {
  const [showLazyComponent, setShowLazyComponent] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  
  return (
    <div className="p-6 max-w-4xl mx-auto bg-[#1A1A1A] rounded-xl">
      <h1 className="text-2xl font-bold mb-4 text-white">Code Splitting Example</h1>
      
      <div className="bg-[#222222] p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2 text-white">How Code Splitting Works</h2>
        <p className="text-gray-300 mb-2">
          Code splitting is a technique that allows you to split your JavaScript bundle into smaller chunks 
          that can be loaded on demand. This can significantly improve the initial load time of your application.
        </p>
        <p className="text-gray-300">
          React provides a built-in way to split code using dynamic <code className="text-[#C1FF2F]">import()</code> and 
          <code className="text-[#C1FF2F]"> React.lazy</code> with <code className="text-[#C1FF2F]">Suspense</code>.
        </p>
      </div>
      
      <div className="bg-[#222222] p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2 text-white">Implementing Code Splitting</h2>
        <div className="bg-[#333333] p-4 rounded-lg mb-4">
          <pre className="text-gray-300 overflow-x-auto">
            {`
// 1. Import lazy and Suspense from React
import React, { lazy, Suspense } from 'react';

// 2. Create a lazy-loaded component
const LazyComponent = lazy(() => import('./LazyComponent'));

// 3. Wrap the lazy component with Suspense and provide a fallback
function MyComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
            `}
          </pre>
        </div>
      </div>
      
      <div className="bg-[#222222] p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2 text-white">Live Example</h2>
        <p className="text-gray-300 mb-4">
          Click the buttons below to load components lazily. Watch the network tab in your browser's 
          developer tools to see the new chunks being loaded when you click the buttons.
        </p>
        
        <div className="flex gap-4 mb-4">
          <button 
            onClick={() => setShowLazyComponent(true)}
            className="bg-[#C1FF2F] text-black py-2 px-4 rounded-lg font-medium hover:bg-[#a4e620] transition-colors"
          >
            Load Lazy Component
          </button>
          
          <button 
            onClick={() => setShowDialog(true)}
            className="bg-[#C1FF2F] text-black py-2 px-4 rounded-lg font-medium hover:bg-[#a4e620] transition-colors"
          >
            Open Lazy Dialog
          </button>
        </div>
        
        {/* Suspense for lazy component */}
        {showLazyComponent && (
          <div className="bg-[#333333] p-4 rounded-lg">
            <Suspense fallback={
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#C1FF2F]"></div>
              </div>
            }>
              <LazyLoadedComponent />
            </Suspense>
          </div>
        )}
        
        {/* Suspense for lazy dialog */}
        {showDialog && (
          <Suspense fallback={
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#C1FF2F]"></div>
            </div>
          }>
            <LazyDialog 
              open={showDialog}
              onClose={() => setShowDialog(false)}
              onEventCreated={() => console.log('Event created')}
            />
          </Suspense>
        )}
      </div>
      
      <div className="bg-[#222222] p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-2 text-white">Best Practices</h2>
        <ul className="list-disc pl-5 text-gray-300 space-y-2">
          <li>Use code splitting for large components that aren't needed immediately</li>
          <li>Good candidates include modal dialogs, complex forms, and secondary routes</li>
          <li>Avoid over-splitting your code into too many small chunks</li>
          <li>Always provide meaningful loading indicators with Suspense</li>
          <li>Consider prefetching important components that will likely be needed soon</li>
        </ul>
      </div>
    </div>
  );
};

// Export as default to work with React.lazy()
export default CodeSplittingExample;
// Also export as named export for direct imports
export { CodeSplittingExample }; 