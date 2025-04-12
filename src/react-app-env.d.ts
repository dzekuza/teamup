/// <reference types="react-scripts" />

declare module 'react' {
  export = React;
  export as namespace React;
  export const useState: React.useState;
  export const useEffect: React.useEffect;
  export const useContext: React.useContext;
  export const useRef: React.useRef;
  export const useCallback: React.useCallback;
  export const useMemo: React.useMemo;
  export const useLayoutEffect: React.useLayoutEffect;
  export const useDebugValue: React.useDebugValue;
  export const forwardRef: React.forwardRef;
  export const createElement: React.createElement;
  export const isValidElement: React.isValidElement;
  export const Children: React.Children;
  export const cloneElement: React.cloneElement;
  export const Fragment: React.Fragment;
  export const version: React.version;
}

declare module 'react-dom' {
  export = ReactDOM;
  export as namespace ReactDOM;
}
