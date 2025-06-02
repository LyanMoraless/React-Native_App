// App.tsx
import React from 'react';
import {
  StyleSheet, Text, View, TextInput, Button,
  TouchableOpacity, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext, useAuthReducer } from './Auth/auth';

const Stack = createStackNavigator();

export default function App() {
  const auth = useAuthReducer();

  return (
    <AuthContext.Provider value={auth}>
      <NavigationContainer>
        <Stack.Navigator>
          {auth.state.isLoading ? (
            <Stack.Screen
              name="Splash"
              component={SplashScreen}
              options={{ headerShown: false }}
            />
          ) : auth.state.userToken == null ? (
            <>
              <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Login' }} />
              <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Cadastro' }} />
            </>
          ) : (
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'Menu Principal', headerLeft: () => null }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

function SplashScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.text}>Carregando...</Text>
    </View>
  );
}

function SignInScreen({ navigation }: {navigation: any} ) {
  const [login, setLogin] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const auth = React.useContext(AuthContext);

  if (!auth) return <Text>Erro: Contexto não encontrado</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sistema de Autenticação</Text>
      <TextInput style={styles.input} placeholder="Login" value={login} onChangeText={setLogin} />
      <TextInput style={styles.input} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
      <Button title="Entrar" onPress={() => auth.signIn(login, senha)} />
      <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.link}>Não tem uma conta? Cadastre-se</Text>
      </TouchableOpacity>
    </View>
  );
}

function SignUpScreen({ navigation }: {navigation: any}) {
  const [login, setLogin] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [confirmaSenha, setConfirmaSenha] = React.useState('');
  const auth = React.useContext(AuthContext);

  if (!auth) return <Text>Erro: Contexto não encontrado</Text>;

  const handleSignUp = async () => {
    if (!login || !senha) return Alert.alert('Erro', 'Preencha todos os campos');
    if (senha !== confirmaSenha) return Alert.alert('Erro', 'As senhas não conferem');
    await auth.register({ username: login, password: senha, confirmPassword: confirmaSenha });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastre-se</Text>
      <TextInput style={styles.input} placeholder="Login" value={login} onChangeText={setLogin} />
      <TextInput style={styles.input} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirme a Senha" value={confirmaSenha} onChangeText={setConfirmaSenha} secureTextEntry />
      <Button title="Cadastrar" onPress={handleSignUp} />
    </View>
  );
}

function HomeScreen() {
  const auth = React.useContext(AuthContext);
  if (!auth) return <Text>Erro: Contexto não encontrado</Text>;
  const { userData } = auth.state;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Menu Principal</Text>
      <Text style={styles.welcome}>Bem-vindo, {userData?.login || 'Usuário'}!</Text>
      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuItemText}>1. Manutenção de Cliente</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuItemText}>2. Manutenção de Usuários</Text></TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}><Text style={styles.menuItemText}>3. Sobre o Time de Desenvolvimento</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={auth.signOut}>
          <Text style={styles.menuItemText}>4. Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { height: 50, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 15, paddingHorizontal: 10 },
  text: { marginTop: 10, fontSize: 16 },
  linkContainer: { marginTop: 15, alignItems: 'center' },
  link: { color: 'blue', textDecorationLine: 'underline' },
  welcome: { fontSize: 18, marginBottom: 20, textAlign: 'center' },
  menuContainer: { width: '100%' },
  menuItem: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 8, marginBottom: 10 },
  menuItemText: { fontSize: 16 },
  logoutButton: { backgroundColor: '#ffcccc' },
});