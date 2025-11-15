import { useEffect, useState } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const initial = (Appearance.getColorScheme() || 'light') as 'light' | 'dark';
  const [scheme, setScheme] = useState<'light' | 'dark'>(initial);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setScheme((colorScheme || 'light') as 'light' | 'dark');
    });
    return () => sub.remove();
  }, []);

  return scheme;
}

export default useColorScheme;
