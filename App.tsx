import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/components/LoginScreen";
import SignUpScreen from "./src/components/RegisterScreen";
import HomeScreen from "./src/components/HomeScreen";
import StudyPlanDetailsScreen from "./src/components/StudyPlanDetails";
import CreateStudyPlanScreen from "./src/components/CreateStudyPlan";
import DailyStudyScreen from "./src/components/DailyStudyPlan";

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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    const [appIsReady, setAppIsReady] = useState(false);

    return (
        <NavigationContainer>
            <Stack.Navigator 
                initialRouteName="Login"
                screenOptions={{
                    headerShown: false // Remove o header se não quiser
                }}
            >
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="StudyPlanDetails" component={StudyPlanDetailsScreen} />
                <Stack.Screen name="CreateStudyPlan" component={CreateStudyPlanScreen} />
                <Stack.Screen name="DailyStudyPlan" component={DailyStudyScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}