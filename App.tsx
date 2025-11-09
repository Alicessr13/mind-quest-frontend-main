import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { AuthUtils } from "./src/utils/auth";
import LoginScreen from "./src/components/LoginScreen";
import SignUpScreen from "./src/components/RegisterScreen";
import HomeScreen from "./src/components/HomeScreen";
import StudyPlanDetailsScreen from "./src/components/StudyPlanDetails";
import CreateStudyPlanScreen from "./src/components/CreateStudyPlan";
import DailyStudyScreen from "./src/components/DailyStudyPlan";
import UserProfile from "./src/components/UserProfile";
import ShopScreen from "./src/components/ShopScreen";
import { useFonts } from "expo-font";

interface DailyPlan {
    study_plan_day_id: string;
    content: {
        subject: string;
    };
    allocated_minutes: number;
    studied_minutes: number;
    status: string;
}

export type RootStackParamList = {
    Login: undefined;
    SignUp: undefined;
    Home: undefined;
    StudyPlanDetails: { id: string };
    CreateStudyPlan: undefined;
    DailyStudyPlan: { day: DailyPlan };
    Profile: undefined;
    ShopScreen: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Tela de loading enquanto verifica o token
function LoadingScreen() {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
        </View>
    );
}

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [fontsLoaded, fontError] = useFonts({
        'PressStart2P-Regular': require('./src/assets/fonts/PressStart2P-Regular.ttf'),
    });

    // Função para verificar se o usuário já está logado
    const checkAuthState = async () => {
        try {
            // Usa o AuthUtils que já tem toda a lógica de validação
            const isAuthenticated = await AuthUtils.checkAuthState();
            setIsLoggedIn(isAuthenticated);
        } catch (error) {
            console.error("Erro ao verificar estado de autenticação:", error);
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkAuthState();
    }, []);

    // Mostra tela de loading enquanto verifica a autenticação
    if (isLoading || !fontsLoaded) {
        return <LoadingScreen />;
    }

    // Opcional: Adicione uma verificação para o caso de a fonte falhar
    if (fontError) {
        // Você pode tratar o erro aqui, por enquanto vamos logar
        console.error("Erro ao carregar a fonte:", fontError);
        return <LoadingScreen />; // Continua no loading para evitar crash
    }

    return (
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName={isLoggedIn ? "Home" : "Login"}
                screenOptions={{
                    headerShown: false
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="StudyPlanDetails" component={StudyPlanDetailsScreen} />
                <Stack.Screen name="CreateStudyPlan" component={CreateStudyPlanScreen} />
                <Stack.Screen name="DailyStudyPlan" component={DailyStudyScreen} />
                <Stack.Screen name="Profile" component={UserProfile} />
                <Stack.Screen name="ShopScreen" component={ShopScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
    },
});