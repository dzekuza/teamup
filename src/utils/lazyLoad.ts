import { lazy, ComponentType } from 'react';

/**
 * Helper function to lazy load components with named exports
 * 
 * React.lazy() requires components to have a default export, but many of our components
 * use named exports. This function handles the conversion.
 * 
 * @param importFn The dynamic import function
 * @param exportName Optional export name to use (if the component uses a named export)
 * @returns A lazy-loaded component compatible with React.lazy()
 * 
 * @example
 * // For a component with default export:
 * const LazyComponent = lazyLoad(() => import('./Component'));
 * 
 * // For a component with named export:
 * const LazyComponent = lazyLoad(() => import('./Component'), 'Component');
 */
export function lazyLoad<T extends ComponentType<any>, P = React.ComponentProps<T>>(
  importFn: () => Promise<any>, 
  exportName?: string
): React.LazyExoticComponent<T> {
  return lazy(() => 
    importFn().then(module => {
      // If exportName is specified, use that export
      if (exportName) {
        return { default: module[exportName] };
      }
      
      // Otherwise try to use default export
      return { default: module.default || Object.values(module)[0] };
    })
  ) as React.LazyExoticComponent<T>;
} 