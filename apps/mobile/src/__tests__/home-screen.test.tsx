import { render, screen } from '@testing-library/react-native';

import HomeScreen from '../app/index';

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
}));

describe('HomeScreen', () => {
  it('shows the app title and version', async () => {
    await render(<HomeScreen />);

    expect(screen.getByTestId('home-title')).toHaveTextContent('App Template');
    expect(screen.getByTestId('app-version')).toHaveTextContent(/^Version /);
  });
});
