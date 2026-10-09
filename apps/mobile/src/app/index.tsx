import * as Application from 'expo-application';
import { Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useFakes } from '../services/registry';

export default function HomeScreen() {
  const version = Application.nativeApplicationVersion ?? 'dev';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Home' }} />
      <Text testID="home-title" style={styles.title}>
        App Template
      </Text>
      <Text testID="app-version">Version {version}</Text>
      {useFakes ? <Text testID="fake-mode-badge">Fake services enabled</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
});
