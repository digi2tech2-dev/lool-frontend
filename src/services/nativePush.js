import { PushNotifications } from '@capacitor/push-notifications';
import { isNativePushAvailable } from '../utils/platform';
import { getSafeInternalRoute } from '../utils/safeInternalRoute';

const PUSH_ACTION_EVENT = 'adcard:push-action';
const CHANNEL = {
  id: 'adcard_general',
  name: 'Lool Store Notifications',
  description: 'Account and order updates from Lool Store',
};

let activeUserId = null;
let currentToken = null;
let initializationPromise = null;
let listenerHandles = [];

const removeListeners = async () => {
  const handles = listenerHandles;
  listenerHandles = [];
  await Promise.allSettled(handles.map((handle) => handle?.remove?.()));
};

const refreshInbox = (refreshNotifications) => {
  Promise.resolve(refreshNotifications?.()).catch(() => {});
};

const attachListeners = async ({ registerToken, refreshNotifications }) => {
  if (listenerHandles.length) return;

  listenerHandles = await Promise.all([
    PushNotifications.addListener('registration', (registration) => {
      const token = String(registration?.value || '').trim();
      if (!token) return;
      currentToken = token;
      Promise.resolve(registerToken?.(token)).catch((error) => {
        console.warn('[Push] token registration failed:', error?.message || error);
      });
    }),
    PushNotifications.addListener('registrationError', (error) => {
      console.warn('[Push] native registration failed:', error?.error || error);
    }),
    PushNotifications.addListener('pushNotificationReceived', () => {
      // The persisted inbox is the UI source of truth; do not show a duplicate toast.
      refreshInbox(refreshNotifications);
    }),
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const route = getSafeInternalRoute(action?.notification?.data?.route);
      if (!route || typeof window === 'undefined') return;
      window.dispatchEvent(new CustomEvent(PUSH_ACTION_EVENT, { detail: { route } }));
    }),
  ]);
};

export const initializeNativePush = async ({ userId, registerToken, refreshNotifications } = {}) => {
  if (!isNativePushAvailable() || !userId) return false;
  if (activeUserId === String(userId) && initializationPromise) return initializationPromise;

  activeUserId = String(userId);
  initializationPromise = (async () => {
    await attachListeners({ registerToken, refreshNotifications });
    const permission = await PushNotifications.checkPermissions();
    const result = permission.receive === 'prompt'
      ? await PushNotifications.requestPermissions()
      : permission;
    if (result.receive !== 'granted') return false;

    await PushNotifications.createChannel({
      ...CHANNEL,
      importance: 4,
      visibility: 1,
      sound: 'default',
      vibration: true,
    });
    await PushNotifications.register();
    return true;
  })().catch((error) => {
    console.warn('[Push] initialization failed:', error?.message || error);
    return false;
  });

  return initializationPromise;
};

export const unregisterNativePush = async ({ unregisterToken } = {}) => {
  if (!isNativePushAvailable()) return;
  const token = currentToken;
  currentToken = null;
  activeUserId = null;
  initializationPromise = null;

  if (token) {
    await Promise.resolve(unregisterToken?.(token)).catch((error) => {
      console.warn('[Push] token unregister failed:', error?.message || error);
    });
  }
  await Promise.resolve(PushNotifications.unregister()).catch((error) => {
    console.warn('[Push] native unregister failed:', error?.message || error);
  });
  await removeListeners();
};

export { PUSH_ACTION_EVENT };
