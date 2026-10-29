import { registerPlugin } from '@capacitor/core';
import { isNativeGoogleAuthAvailable } from '../utils/platform';

const NativeGoogleAuth = registerPlugin('NativeGoogleAuth');

const unavailable = () => {
  throw new Error('Native Google Sign-In is only available in the Android Lool Store app.');
};

export const signInWithNativeGoogle = async () => {
  if (!isNativeGoogleAuthAvailable()) return unavailable();
  return NativeGoogleAuth.signIn();
};

export const clearNativeGoogleCredentialState = async () => {
  if (!isNativeGoogleAuthAvailable()) return;
  await NativeGoogleAuth.signOut();
};
