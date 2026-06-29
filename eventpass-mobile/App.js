import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { getSession } from './src/backend/session';
import LoginScreen from './src/frontend/screens/LoginScreen';
import HomeScreen from './src/frontend/screens/HomeScreen';
import CreateEventScreen from './src/frontend/screens/CreateEventScreen';
import EventDetailScreen from './src/frontend/screens/EventDetailScreen';
import AddGuestScreen from './src/frontend/screens/AddGuestScreen';
import TicketViewScreen from './src/frontend/screens/TicketViewScreen';
import ScannerScreen from './src/frontend/screens/ScannerScreen';
import { C, F } from './src/frontend/theme';

const Stack = createNativeStackNavigator();

export default function App() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    (async () => {
      const session = await getSession();
      setInitialRoute(session?.token ? 'Home' : 'Login');
      setCheckingSession(false);
    })();
  }, []);

  if (checkingSession || !fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: C.primary },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontFamily: F.display, fontSize: 18 },
            contentStyle: { backgroundColor: C.bg },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: 'EventPass' }}
          />
          <Stack.Screen
            name="CreateEvent"
            component={CreateEventScreen}
            options={{ title: 'New Event' }}
          />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={({ route }) => ({ title: route.params?.eventName ?? 'Event' })}
          />
          <Stack.Screen
            name="AddGuest"
            component={AddGuestScreen}
            options={{ title: 'Add Guest' }}
          />
          <Stack.Screen
            name="TicketView"
            component={TicketViewScreen}
            options={{ title: 'Ticket' }}
          />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
