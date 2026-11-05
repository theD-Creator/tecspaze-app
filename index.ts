// The background location task must be registered at module scope before the
// router mounts, so the headless JS context (app closed) can find it.
import 'react-native-url-polyfill/auto';
import './src/lib/trackingTask';
import 'expo-router/entry';
