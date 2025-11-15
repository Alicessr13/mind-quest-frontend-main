import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from "react-native";
import axios from "axios";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import { AuthUtils } from "../utils/auth";
import { api } from "../api";
import LoginImage from "./img/LoginImage";
import { SafeAreaView } from "react-native-safe-area-context";

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
            const response = await api.post("/sign-in", {
                email,
                password
            });

            const token = response.data.token;
            const name = response.data.name;

            await AuthUtils.saveToken(token);

            Alert.alert("Sucesso", `Bem-vindo, ${name}!`);

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
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Animated Background Border */}
                <View style={styles.decorativeBorder}>
                    <Text style={styles.borderPattern}>████████████████████████████</Text>
                </View>

                {/* Logo/Title Box */}
                <View style={styles.titleBox}>
                    <View style={styles.titleBorder}>
                        <Text style={styles.title}>🎮 MIND QUEST 🎮</Text>
                        <Text style={styles.subtitle}>ADVENTURE AWAITS!</Text>
                    </View>
                </View>

                {/* Login Form Box */}
                <View style={styles.formBox}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>▼ PLAYER LOGIN ▼</Text>
                    </View>

                    {/* Email Input */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>📧 EMAIL:</Text>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.input}
                                placeholder="DIGITE SEU EMAIL..."
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
                                placeholder="DIGITE SUA SENHA..."
                                placeholderTextColor="#64748b"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!loading}
                            />
                        </View>
                    </View>

                    {/* Login Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="#FFD700" />
                                <Text style={styles.loadingText}>CONECTANDO...</Text>
                            </View>
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={styles.buttonIcon}>▶</Text>
                                <Text style={styles.loginButtonText}>INICIAR JOGO</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Sign Up Link */}
                    <View style={styles.signupBox}>
                        <Text style={styles.signupQuestion}>NOVO JOGADOR?</Text>
                        <TouchableOpacity
                            style={styles.signupButton}
                            onPress={() => navigation.navigate("SignUp")}
                            disabled={loading}
                        >
                            <Text style={styles.signupButtonText}>+ CRIAR CONTA</Text>
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#1a1a2e",
    },
    container: {
        flex: 1,
        padding: 20,
        justifyContent: "center",
        backgroundColor: "#1a1a2e",
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
        borderColor: "#FFD700",
        padding: 16,
        alignItems: "center",
    },
    title: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 18,
        color: "#FFD700",
        textAlign: "center",
        marginBottom: 8,
        textShadowColor: "#000",
        textShadowOffset: { width: 3, height: 3 },
        textShadowRadius: 0,
    },
    subtitle: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#3b82f6",
        textAlign: "center",
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
        color: "#FFD700",
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

    // Login Button
    loginButton: {
        backgroundColor: "#10b981",
        borderWidth: 4,
        borderColor: "#059669",
        margin: 16,
        marginTop: 8,
        padding: 16,
        alignItems: "center",
    },
    loginButtonDisabled: {
        backgroundColor: "#64748b",
        borderColor: "#475569",
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    buttonIcon: {
        fontSize: 16,
        color: "#fff",
    },
    loginButtonText: {
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

    // Sign Up Box
    signupBox: {
        backgroundColor: "#0f3460",
        borderTopWidth: 4,
        borderTopColor: "#1a1a2e",
        padding: 16,
        alignItems: "center",
        gap: 12,
    },
    signupQuestion: {
        fontFamily: "PressStart2P-Regular",
        fontSize: 8,
        color: "#94a3b8",
    },
    signupButton: {
        backgroundColor: "#3b82f6",
        borderWidth: 3,
        borderColor: "#2563eb",
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    signupButtonText: {
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