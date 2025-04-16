declare module 'maplibre-gl' {
  const maplibregl: any;
  export default maplibregl;
}

declare module 'react-map-gl/maplibre' {
  import * as React from 'react';
  
  export interface MapProps {
    initialViewState?: {
      longitude: number;
      latitude: number;
      zoom: number;
    };
    style?: React.CSSProperties;
    mapStyle?: string;
    mapboxAccessToken?: string;
    mapLib?: Promise<any>;
    children?: React.ReactNode;
    attributionControl?: boolean;
    onError?: (error: Error) => void;
  }
  
  export interface MarkerProps {
    longitude: number;
    latitude: number;
    anchor?: string;
    children?: React.ReactNode;
  }
  
  const Map: React.FC<MapProps>;
  export const Marker: React.FC<MarkerProps>;
  
  export default Map;
} 