import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { sendPing } from './ping';

export const LOCATION_TASK = 'tecspaze-presence';

type TaskData = { locations?: Location.LocationObject[] };

// Runs in the background (also when the app is closed) on Android via a
// foreground service. Each location fix goes to the server, which decides
// whether the user is inside the Tecspaze geofence and starts/stops the timer.
if (Platform.OS !== 'web') {
  TaskManager.defineTask<TaskData>(LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.warn('[tracking] task error', error.message);
      return;
    }
    const locations = data?.locations ?? [];
    const latest = locations[locations.length - 1];
    if (!latest) return;
    try {
      await sendPing(latest.coords, { source: 'background' });
    } catch (e) {
      console.warn('[tracking] ping failed', e);
    }
  });
}
