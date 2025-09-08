import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator
} from "react-native";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { AuthUtils } from "../utils/auth"; // Importe os utilitários

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
    const navigation = useNavigation<LoginScreenProp>();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Erro", "Preencha todos os campos!");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post("http://192.168.0.17:3333/sign-in", {
                email,
                password
            });

            const token = response.data.token;
            const name = response.data.name;

            // Usa o utilitário para salvar o token
            await AuthUtils.saveToken(token);

            Alert.alert("Sucesso", `Bem-vindo, ${name}!`);

            // Reseta a navegação para Home
            navigation.reset({
                index: 0,
                routes: [{ name: "Home" }]
            });

        } catch (error: any) {
            console.error("Erro no login:", error);

            const errorMessage = error.response?.data?.message || "Falha no login";
            Alert.alert("Erro", errorMessage);

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
                editable={!loading}
            />

            <TextInput
                style={styles.input}
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
            />

            <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Login</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => navigation.navigate("SignUp")}
                disabled={loading}
            >
                <Text style={styles.link}>
                    Não tem conta? Cadastre-se
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#A1C7E0"
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 40,
        textAlign: "center"
    },
    input: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 8,
        marginBottom: 15
    },
    button: {
        backgroundColor: "#3b82f6",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
        marginBottom: 20,
    },
    buttonDisabled: {
        backgroundColor: "#94a3b8",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16
    },
    link: {
        color: "#007bff",
        marginTop: 10,
        textAlign: "center"
    },
});