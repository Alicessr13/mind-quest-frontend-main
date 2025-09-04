import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";

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
            const response = await axios.post("http://192.168.0.17:3333/sign-in", { email, password });
            console.log(response);
            const token = response.data.token; // backend deve retornar isso
            await SecureStore.setItemAsync("authToken", token); 

            Alert.alert("Sucesso", "Login realizado!");
            navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        } catch (error: any) {
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
            <Button title={loading ? "Entrando..." : "Login"} onPress={handleLogin} disabled={loading} />
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
    link: { color: "#007bff", marginTop: 20, textAlign: "center" },
});