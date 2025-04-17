declare module 'qrcode.react' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface QRCodeProps {
    value: string;
    size?: number;
    level?: 'L' | 'M' | 'Q' | 'H';
    bgColor?: string;
    fgColor?: string;
    style?: object;
    includeMargin?: boolean;
    imageSettings?: {
      src: string;
      height: number;
      width: number;
      excavate?: boolean;
    };
  }
  
  export const QRCodeSVG: ComponentType<QRCodeProps>;
  export const QRCodeCanvas: ComponentType<QRCodeProps>;
} 