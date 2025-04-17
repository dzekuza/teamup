declare module 'i18next' {
  interface i18n {
    changeLanguage: (lng: string) => Promise<any>;
    t: (key: string, options?: any) => string;
    use: (plugin: any) => i18n;
    init: (options: any) => Promise<any>;
  }
  
  const i18next: i18n;
  export default i18next;
}

declare module 'react-i18next' {
  import { ComponentType, ReactNode } from 'react';
  
  export interface UseTranslationResponse {
    t: (key: string, options?: any) => string;
    i18n: any;
  }
  
  export function useTranslation(ns?: string | string[]): UseTranslationResponse;
  
  export interface WithTranslationProps {
    t: (key: string, options?: any) => string;
    i18n: any;
    tReady: boolean;
  }
  
  export function withTranslation(ns?: string | string[]): 
    <P extends WithTranslationProps>(component: ComponentType<P>) => ComponentType<Omit<P, keyof WithTranslationProps>>;
  
  export interface I18nextProviderProps {
    i18n: any;
    children: ReactNode;
  }
  
  export const I18nextProvider: ComponentType<I18nextProviderProps>;
  
  export const initReactI18next: {
    type: string;
  };
} 