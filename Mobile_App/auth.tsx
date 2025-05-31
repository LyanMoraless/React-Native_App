// auth.tsx
import React, { createContext, useReducer, useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:3000';

export type User = {
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

type LoginResponse = {
  token: string;
  userData: User;
};

export type RegisterData = {
  username: string;
  password: string;
  confirmPassword: string;
};

export type AuthContextType = {
  state: AuthState;
  signIn: (login: string, senha: string) => Promise<LoginResponse | void>;
  register: (data: RegisterData) => Promise<LoginResponse | void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  isLoading: true,
  isSignout: false,
  userToken: null,
  userData: null,
};

function authReducer(prevState: AuthState, action: AuthAction): AuthState {
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
}

export function useAuthReducer() {
  const [state, dispatch] = useReducer(authReducer, initialState);

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
        } else {
          userToken = localStorage.getItem('userToken');
          const userDataString = localStorage.getItem('userData');
          if (userDataString) {
            userData = JSON.parse(userDataString);
          }
        }
      } catch (e) {
        console.error('Falha ao restaurar token:', e);
      }
      dispatch({ type: 'RESTORE_TOKEN', token: userToken, userData });
    };
    bootstrapAsync();
  }, []);

  const signIn = async (login: string, senha: string) => {
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

      if (!data.token) throw new Error('Token não recebido da API');
      if (!data.usuario) throw new Error('Usuário não encontrado');

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
  };

  const signOut = async () => {
    if (Platform.OS === 'web') {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
    } else {
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
    }
    dispatch({ type: 'SIGN_OUT' });
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login: data.username, senha: data.password }),
      });
      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.erro || 'Erro ao cadastrar');
      }
      Alert.alert('Cadastro realizado', 'Usuário cadastrado com sucesso. Faça login para continuar.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Erro no cadastro', errorMessage);
    }
  };

  return {
    state,
    signIn,
    signOut,
    register,
  };
}