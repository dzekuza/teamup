declare module 'react-map-gl' {
  import { ReactNode } from 'react';
  import { Map as MapboxMap } from 'mapbox-gl';

  export interface MapProps {
    initialViewState?: {
      longitude: number;
      latitude: number;
      zoom: number;
    };
    style?: React.CSSProperties;
    mapStyle?: string;
    mapboxAccessToken?: string;
    children?: ReactNode;
    reuseMaps?: boolean;
    ref?: React.RefObject<MapRef>;
  }

  export interface MarkerProps {
    longitude: number;
    latitude: number;
    anchor?: string;
    children?: ReactNode;
  }

  export interface MapRef extends MapboxMap {}

  export const Map: React.FC<MapProps>;
  export const Marker: React.FC<MarkerProps>;
} 