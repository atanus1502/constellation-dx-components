import type { PCore as PCoreType } from '@pega/pcore-pconnect-typedefs';

declare global {
  const PCore: PCoreType;

  interface Window {
    PCore: PCoreType;
  }
}

export {};