import React, { useState, useEffect } from 'react';

/**
 * This is a component that will be lazy-loaded in our code splitting example.
 * In a real application, this would be a more complex component that isn't needed
 * on the initial page load.
 */
const LazyLoadedComponent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setData([
        { id: 1, name: 'Item 1', description: 'This is the first item' },
        { id: 2, name: 'Item 2', description: 'This is the second item' },
        { id: 3, name: 'Item 3', description: 'This is the third item' },
        { id: 4, name: 'Item 4', description: 'This is the fourth item' },
        { id: 5, name: 'Item 5', description: 'This is the fifth item' },
      ]);
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-300">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="text-white">
      <h3 className="text-xl font-semibold mb-4">Lazy Loaded Component</h3>
      <p className="text-gray-300 mb-4">
        This component was loaded only when needed, reducing the initial bundle size.
        It also performs its own data fetching after it's loaded.
      </p>
      
      <div className="space-y-3">
        {data.map(item => (
          <div key={item.id} className="bg-[#444444] p-3 rounded-lg">
            <h4 className="font-medium text-[#C1FF2F]">{item.name}</h4>
            <p className="text-gray-300 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LazyLoadedComponent; 