import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { useNavigation } from "@react-navigation/native";

type SignUpScreenProp = NativeStackNavigationProp<RootStackParamList, "SignUp">;

export default function SignUpScreen() {
  const navigation = useNavigation<SignUpScreenProp>();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      Alert.alert("Erro", "Todos os campos são obrigatórios!");
      return;
    }

    setLoading(true);

    try {
      await axios.post("http://192.168.0.17:3333/sign-up", { name, email, password });
      Alert.alert("Sucesso", "Cadastro realizado!");
      navigation.navigate("Login");
    } catch (error: any) {
      Alert.alert("Erro", error.response?.data?.message || "Não foi possível cadastrar o usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro</Text>
      <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
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
      <Button title={loading ? "Cadastrando..." : "Cadastrar"} onPress={handleSignUp} disabled={loading} />
      <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
        Já tem conta? Faça login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", backgroundColor: "#f2f2f2" },
  title: { fontSize: 32, fontWeight: "bold", marginBottom: 40, textAlign: "center" },
  input: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 15 },
  link: { color: "#007bff", marginTop: 20, textAlign: "center" },
});