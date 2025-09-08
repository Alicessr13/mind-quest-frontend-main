import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const API_BASE_URL = "http://192.168.0.17:3333";

export class AuthUtils {
    // Função para salvar token de forma segura
    static async saveToken(token: string): Promise<void> {
        try {
            // Tenta usar SecureStore primeiro (mais seguro)
            await SecureStore.setItemAsync("token", token);
        } catch (error) {
            console.error("Erro ao salvar no SecureStore, usando AsyncStorage:", error);
            // Fallback para AsyncStorage se SecureStore falhar
            await AsyncStorage.setItem("token", token);
        }
    }

    // Função para recuperar o token
    static async getToken(): Promise<string | null> {
        try {
            // Tenta buscar no SecureStore primeiro
            const token = await SecureStore.getItemAsync("token");
            return token;
        } catch (error) {
            console.error("Erro ao buscar no SecureStore, tentando AsyncStorage:", error);
            // Fallback para AsyncStorage
            return await AsyncStorage.getItem("token");
        }
    }

    // Função para remover o token
    static async removeToken(): Promise<void> {
        try {
            await SecureStore.deleteItemAsync("token");
        } catch (error) {
            console.error("Erro ao remover do SecureStore, tentando AsyncStorage:", error);
            await AsyncStorage.removeItem("token");
        }
    }

    // Função para verificar se o token é válido
    static async validateToken(token: string): Promise<boolean> {
        try {
            const response = await axios.get(`${API_BASE_URL}/user`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000, // 5 segundos de timeout
            });
            return response.status === 200;
        } catch (error) {
            console.log("Token inválido:", error);
            return false;
        }
    }

    // Função para fazer logout completo
    static async logout(): Promise<void> {
        try {
            await AuthUtils.removeToken();
        } catch (error) {
            console.error("Erro durante logout:", error);
        }
    }

    // Função para verificar estado de autenticação
    static async checkAuthState(): Promise<boolean> {
        try {
            const token = await AuthUtils.getToken();
            
            if (!token) {
                return false;
            }

            const isValid = await AuthUtils.validateToken(token);
            
            if (!isValid) {
                // Token inválido, remove
                await AuthUtils.removeToken();
                return false;
            }

            return true;
        } catch (error) {
            console.error("Erro ao verificar estado de autenticação:", error);
            return false;
        }
    }
}