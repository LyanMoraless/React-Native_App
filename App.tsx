import React, { createContext, useReducer, useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Button,
  TouchableOpacity, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// URL da API - SUBSTITUA PELO SEU IP LOCAL
const API_URL = 'http://localhost:3000';

// Definição de tipos para TypeScript
type User = {
  id: number;
  login: string;
};

type AuthState = {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
  userData: User | null;
};

type AuthAction =
  | { type: 'RESTORE_TOKEN'; token: string | null; userData: User | null }
  | { type: 'SIGN_IN'; token: string; userData: User }
  | { type: 'SIGN_OUT' };

type AuthContextType = {
  state: AuthState;
  signIn: (login: string, senha: string) => Promise<any>;
  signOut: () => void;
  signUp: (login: string, senha: string) => Promise<any>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function App() {
  const [state, dispatch] = useReducer(
    (prevState: AuthState, action: AuthAction): AuthState => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          console.log('RESTORE_TOKEN', action.token);
          return {
            ...prevState,
            userToken: action.token,
            userData: action.userData,
            isLoading: false,
          };
        case 'SIGN_IN':
          console.log('SIGN_IN', action.token);
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
            userData: action.userData,
          };
        case 'SIGN_OUT':
          console.log('SIGN_OUT');
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
            userData: null,
          };
        default:
          return prevState;
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
      userData: null,
    }
  );

  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken: string | null = null;
      let userData: User | null = null;
      try {
        if (Platform.OS !== 'web') {
          userToken = await SecureStore.getItemAsync('userToken');
          const userDataString = await SecureStore.getItemAsync('userData');
          if (userDataString) {
            userData = JSON.parse(userDataString);
          }
          console.log('Token recuperado:', userToken);
        } else {
          userToken = localStorage.getItem('userToken');
          const userDataString = localStorage.getItem('userData');
          if (userDataString) {
            userData = JSON.parse(userDataString);
          }
          console.log('Token recuperado (web):', userToken);
        }
      } catch (e) {
        console.error('Falha ao restaurar token:', e);
      }
      dispatch({ type: 'RESTORE_TOKEN', token: userToken, userData });
    };
    bootstrapAsync();
  }, []);

  const authContext: AuthContextType = {
    state,
    signIn: async (login, senha) => {
      try {
        const response = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ login, senha }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.erro || 'Erro ao fazer login');
        }
        // Verificar token e usuário
        if (!data.token) throw new Error('Token não recebido da API');
        if (!data.usuario) throw new Error('Usuário não encontrado');
        // Salvar token e dados
        if (Platform.OS === 'web') {
          localStorage.setItem('userToken', data.token);
          localStorage.setItem('userData', JSON.stringify(data.usuario));
        } else {
          await SecureStore.setItemAsync('userToken', data.token);
          await SecureStore.setItemAsync('userData', JSON.stringify(data.usuario));
        }
        dispatch({ type: 'SIGN_IN', token: data.token, userData: data.usuario });
        console.log('Login realizado com sucesso!');
      } catch (error) {
        console.error('Erro no login:', error);
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        Alert.alert('Erro no login', errorMessage);
      }
    },
    signOut: async () => {
      if (Platform.OS === 'web') {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
      } else {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
      }
      dispatch({ type: 'SIGN_OUT' });
    },
    signUp: async (login, senha) => {
      try {
        const response = await fetch(`${API_URL}/usuarios`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ login, senha }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.erro || 'Erro ao cadastrar');
        }
        Alert.alert(
          'Cadastro realizado',
          'Usuário cadastrado com sucesso. Faça login para continuar.'
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        Alert.alert('Erro no cadastro', errorMessage);
      }
    },
  };

  const Stack = createStackNavigator();

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <Stack.Navigator>
          {state.isLoading ? (
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{ headerShown: false }}
            />
          ) : state.userToken == null ? (
            <>
              <Stack.Screen
                name="SignIn"
                component={SignInScreen}
                options={{ title: 'Login' }}
              />
              <Stack.Screen
                name="SignUp"
                component={SignUpScreen}
                options={{ title: 'Cadastro' }}
              />
            </>
          ) : (
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                title: 'Menu Principal',
                headerLeft: () => null,
              }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

// Componentes das telas (mantidos iguais)

function SplashScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.text}>Carregando...</Text>
    </View>
  );
}

function SignInScreen({ navigation }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const auth = React.useContext(AuthContext);

  if (!auth) {
    return <Text>Erro: Contexto de autenticação não encontrado</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sistema de Autenticação</Text>
      <TextInput
        style={styles.input}
        placeholder="Login"
        value={login}
        onChangeText={setLogin}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      <Button
        title="Entrar"
        onPress={() => auth.signIn(login, senha)}
      />
      <TouchableOpacity
        style={styles.linkContainer}
        onPress={() => navigation.navigate('SignUp')}
      >
        <Text style={styles.link}>Não tem uma conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

function SignUpScreen({ navigation }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const auth = React.useContext(AuthContext);

  if (!auth) {
    return <Text>Erro: Contexto de autenticação não encontrado</Text>;
  }

  const handleSignUp = async () => {
    if (!login || !senha) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (senha !== confirmaSenha) {
      Alert.alert('Erro', 'As senhas não conferem');
      return;
    }
    await auth.signUp(login, senha);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastre-se</Text>
      <TextInput
        style={styles.input}
        placeholder="Login"
        value={login}
        onChangeText={setLogin}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />
      <TextInput
        style={styles.input}
        placeholder="Confirme a Senha"
        value={confirmaSenha}
        onChangeText={setConfirmaSenha}
        secureTextEntry
      />
      <Button
        title="Cadastrar"
        onPress={handleSignUp}
      />
    </View>
  );
}

function HomeScreen() {
  const auth = React.useContext(AuthContext);

  if (!auth) {
    return <Text>Erro: Contexto de autenticação não encontrado</Text>;
  }

  const { userData } = auth.state;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Menu Principal</Text>
      <Text style={styles.welcome}>
        Bem-vindo, {userData?.login || 'Usuário'}!
      </Text>
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>1. Manutenção de Cliente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>2. Manutenção de Usuários</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>3. Sobre o Time de Desenvolvimento</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.menuItem, styles.logoutButton]}
          onPress={() => auth.signOut()}
        >
          <Text style={styles.menuItemText}>4. Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    width: '100%',
  },
  text: {
    marginTop: 10,
    fontSize: 16,
  },
  linkContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  welcome: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  menuContainer: {
    width: '100%',
  },
  menuItem: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  menuItemText: {
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#ffcccc',
  },
});
