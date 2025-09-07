import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../App";

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
    const navigation = useNavigation<LoginScreenProp>();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Função para salvar token de forma segura
    const saveToken = async (key: string, value: string) => {
        try {
            await AsyncStorage.setItem(key, value);
            // Em dispositivos móveis, usa SecureStore
            // await SecureStore.setItemAsync(key, value);
        } catch (error) {
            console.error('Erro ao salvar token:', error);
            // Fallback para AsyncStorage se SecureStore falhar
            await AsyncStorage.setItem(key, value);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Erro", "Preencha todos os campos!");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post("http://192.168.0.17:3333/sign-in", { email, password });

            // Backend retorna token e nome do usuário
            const token = response.data.token;
            const name = response.data.name;

            // Salva o token de forma segura
            await saveToken("token", token);

            Alert.alert("Sucesso", `Bem-vindo, ${name}!`);
            navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        } catch (error: any) {
            console.error(error);
            Alert.alert("Erro", error.response?.data?.message || "Falha no login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Login</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
            </TouchableOpacity>

            <Text style={styles.link} onPress={() => navigation.navigate("SignUp")}>
                Não tem conta? Cadastre-se
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#A1C7E0" },
    title: { fontSize: 32, fontWeight: "bold", marginBottom: 40, textAlign: "center" },
    input: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 15 },
    button: {
        backgroundColor: "#3b82f6",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 20,
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    link: { color: "#007bff", marginTop: 10, textAlign: "center" },
});