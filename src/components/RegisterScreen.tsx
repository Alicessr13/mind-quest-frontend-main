import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api";
import RegisterImage from "./img/RegisterImage";
import { SafeAreaView } from "react-native-safe-area-context";

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
      await api.post("/sign-up", { name, email, password });
      Alert.alert("Sucesso", "Cadastro realizado!");
      navigation.navigate("Login");
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      Alert.alert("Erro", error.response?.data?.message || "Não foi possível cadastrar o usuário.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#1a1a2e" }}>
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Decorative Top Border */}
        <View style={styles.decorativeBorder}>
          <Text style={styles.borderPattern}>████████████████████████████</Text>
        </View>

        {/* Title Box */}
        <View style={styles.titleBox}>
          <View style={styles.titleBorder}>
            <Text style={styles.title}>🎮 MIND QUEST 🎮</Text>
            <Text style={styles.subtitle}>NEW PLAYER REGISTRATION</Text>
          </View>
        </View>

        {/* Register Image
        <View style={styles.imageContainer}>
          <RegisterImage />
        </View> */}

        {/* Registration Form Box */}
        <View style={styles.formBox}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>▼ CRIAR JOGADOR ▼</Text>
          </View>

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>👤 NOME:</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="SEU NOME DE JOGADOR..."
                placeholderTextColor="#64748b"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>📧 EMAIL:</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="SEU@EMAIL.COM..."
                placeholderTextColor="#64748b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🔒 SENHA:</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="CRIE UMA SENHA..."
                placeholderTextColor="#64748b"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.signupButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFD700" />
                <Text style={styles.loadingText}>CRIANDO...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.buttonIcon}>+</Text>
                <Text style={styles.signupButtonText}>CRIAR CONTA</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginBox}>
            <Text style={styles.loginQuestion}>JÁ TEM CONTA?</Text>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate("Login")}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>◄ FAZER LOGIN</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Decorative Border */}
        <View style={styles.decorativeBorderBottom}>
          <Text style={styles.borderPattern}>████████████████████████████</Text>
        </View>

        {/* Credits */}
        <Text style={styles.credits}>© 2025 PIXEL STUDIOS</Text>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: "#1a1a2e",
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    minHeight: '100%',
  },

  // Decorative Borders
  decorativeBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f3460",
    padding: 8,
    overflow: "hidden",
  },
  decorativeBorderBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#0f3460",
    padding: 8,
    overflow: "hidden",
  },
  borderPattern: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 6,
    color: "#16213e",
    textAlign: "center",
  },

  // Title Box
  titleBox: {
    marginBottom: 24,
    alignItems: "center",
  },
  titleBorder: {
    backgroundColor: "#0f3460",
    borderWidth: 4,
    borderColor: "#10b981",
    padding: 16,
    alignItems: "center",
  },
  title: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 18,
    color: "#10b981",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "#000",
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 7,
    color: "#3b82f6",
    textAlign: "center",
    lineHeight: 14,
  },

  // Image Container
  imageContainer: {
    alignItems: "center",
    marginBottom: 24,
  },

  // Form Box
  formBox: {
    backgroundColor: "#16213e",
    borderWidth: 4,
    borderColor: "#0f3460",
  },
  formHeader: {
    backgroundColor: "#0f3460",
    padding: 12,
    borderBottomWidth: 4,
    borderBottomColor: "#16213e",
  },
  formTitle: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 10,
    color: "#10b981",
    textAlign: "center",
  },

  // Input Groups
  inputGroup: {
    padding: 16,
    paddingBottom: 8,
  },
  inputLabel: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 8,
    color: "#94a3b8",
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: "#0f3460",
    borderWidth: 4,
    borderColor: "#1a1a2e",
  },
  input: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 10,
    color: "#fff",
    padding: 12,
    minHeight: 48,
  },

  // Sign Up Button
  signupButton: {
    backgroundColor: "#10b981",
    borderWidth: 4,
    borderColor: "#059669",
    margin: 16,
    marginTop: 8,
    padding: 16,
    alignItems: "center",
  },
  signupButtonDisabled: {
    backgroundColor: "#64748b",
    borderColor: "#475569",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buttonIcon: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "PressStart2P-Regular",
  },
  signupButtonText: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 12,
    color: "#fff",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 10,
    color: "#FFD700",
  },

  // Login Box
  loginBox: {
    backgroundColor: "#0f3460",
    borderTopWidth: 4,
    borderTopColor: "#1a1a2e",
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  loginQuestion: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 8,
    color: "#94a3b8",
  },
  loginButton: {
    backgroundColor: "#3b82f6",
    borderWidth: 3,
    borderColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loginButtonText: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 10,
    color: "#fff",
  },

  // Credits
  credits: {
    fontFamily: "PressStart2P-Regular",
    fontSize: 6,
    color: "#0f3460",
    textAlign: "center",
    marginTop: 16,
  },
});