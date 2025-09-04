import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../App";
import { useNavigation } from "@react-navigation/native";

enum WeekDays {
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6,
}

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, "Home">;

export default function HomeScreen() {
    const navigation = useNavigation<HomeScreenProp>();

    const [subject, setSubject] = useState("");
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [minutesPerDay, setMinutesPerDay] = useState("");
    const [weekDays, setWeekDays] = useState<number[]>([]);

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const toggleDay = (day: number) => {
        if (weekDays.includes(day)) {
            setWeekDays(weekDays.filter(d => d !== day));
        } else {
            setWeekDays([...weekDays, day]);
        }
    };

    const handleCreatePlan = async () => {
        if (!subject || !minutesPerDay || weekDays.length === 0) {
            Alert.alert("Erro", "Preencha todos os campos!");
            return;
        }

        try {
            const token = await SecureStore.getItemAsync("authToken"); // 🔒 pega o token salvo

            if (!token) {
                Alert.alert("Erro", "Usuário não autenticado!");
                return;
            }

            await axios.post("http://192.168.0.17:3333/study-plan", {
                subject,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                week_days: weekDays,
                minutes_per_day: Number(minutesPerDay),
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert("Sucesso", "Plano de estudos criado!");
            setSubject("");
            setMinutesPerDay("");
            setWeekDays([]);
        } catch (error: any) {
            Alert.alert("Erro", error.response?.data?.message || "Não foi possível criar o plano.");
        }
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync("authToken");
        navigation.reset({ index: 0, routes: [{ name: "Login" }] });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Novo Plano de Estudos</Text>

            <TextInput
                style={styles.input}
                placeholder="Assunto"
                value={subject}
                onChangeText={setSubject}
            />

            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
                <Text>Data inicial: {startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showStartPicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={(_, date) => {
                        setShowStartPicker(false);
                        if (date) setStartDate(date);
                    }}
                />
            )}

            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
                <Text>Data final: {endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {showEndPicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={(_, date) => {
                        setShowEndPicker(false);
                        if (date) setEndDate(date);
                    }}
                />
            )}

            <TextInput
                style={styles.input}
                placeholder="Minutos por dia"
                value={minutesPerDay}
                onChangeText={setMinutesPerDay}
                keyboardType="numeric"
            />

            <Text style={styles.label}>Dias da semana:</Text>
            <View style={styles.daysContainer}>
                {Object.keys(WeekDays)
                    .filter(k => isNaN(Number(k))) // pega só os nomes
                    .map((day, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dayButton,
                                weekDays.includes(index) && styles.daySelected,
                            ]}
                            onPress={() => toggleDay(index)}
                        >
                            <Text style={styles.dayText}>{day.substring(0, 3)}</Text>
                        </TouchableOpacity>
                    ))}
            </View>

            <Button title="Criar Plano" onPress={handleCreatePlan} />

            <Button title="Logout" onPress={handleLogout} />
        </View>

        
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f2f2f2" },
    title: { fontSize: 28, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
    input: { backgroundColor: "#fff", padding: 15, borderRadius: 8, marginBottom: 15 },
    label: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
    daysContainer: { flexDirection: "row", flexWrap: "wrap", marginBottom: 15 },
    dayButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#ddd",
        marginRight: 5,
        marginBottom: 5,
    },
    daySelected: { backgroundColor: "#4caf50" },
    dayText: { color: "#000" },
    dateButton: {
        padding: 15,
        backgroundColor: "#fff",
        borderRadius: 8,
        marginBottom: 15,
    },
});