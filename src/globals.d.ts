import type { PCore as PCoreClass } from '@pega/pcore-pconnect-typedefs';
import type { C11nEnv } from '@pega/pcore-pconnect-typedefs/interpreter/c11n-env';

// @pega/pcore-pconnect-typedefs 5.x no longer declares these globals itself.
declare global {
  const PCore: PCoreClass;
  // Typed so components can write `getPConnect: () => typeof PConnect`.
  const PConnect: C11nEnv;

  interface Window {
    PCore: PCoreClass;
  }
}

export {};
