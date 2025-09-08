import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../../App";
import axios from "axios";
import { AuthUtils } from "../utils/auth";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "CreateStudyPlan">;

const weekDays = [
    { label: "Dom", value: 0 },
    { label: "Seg", value: 1 },
    { label: "Ter", value: 2 },
    { label: "Qua", value: 3 },
    { label: "Qui", value: 4 },
    { label: "Sex", value: 5 },
    { label: "Sáb", value: 6 },
];

export default function CreateStudyPlanScreen() {
    const navigation = useNavigation<NavigationProp>();

    const [subject, setSubject] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [weekDaysSelected, setWeekDaysSelected] = useState<number[]>([]);
    const [minutesPerDay, setMinutesPerDay] = useState("");
    
    // Estados para controlar a visibilidade dos DatePickers
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);

    const toggleWeekDay = (day: number) => {
        setWeekDaysSelected((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('pt-BR');
    };

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || startDate;
        setShowStartDatePicker(Platform.OS === 'ios');
        setStartDate(currentDate);
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        const currentDate = selectedDate || endDate;
        setShowEndDatePicker(Platform.OS === 'ios');
        setEndDate(currentDate);
    };

    const handleSubmit = async () => {
        if (!subject || weekDaysSelected.length === 0 || !minutesPerDay) {
            return Alert.alert("Erro", "Preencha todos os campos.");
        }

        try {
            const token = await AuthUtils.getToken();
            const item = await axios.post(
                "http://192.168.0.17:3333/study-plan",
                {
                    subject,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    week_days: weekDaysSelected,
                    minutes_per_day: Number(minutesPerDay),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            Alert.alert("Sucesso", "Plano de estudo criado!");
            navigation.navigate("StudyPlanDetails", { id: item.data });
        } catch (err) {
            console.error(err);
            Alert.alert("Erro", "Não foi possível criar o plano.");
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.label}>Matéria</Text>
            <TextInput
                style={styles.input}
                placeholder="Digite a matéria"
                value={subject}
                onChangeText={setSubject}
            />

            <Text style={styles.label}>Data de início</Text>
            <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowStartDatePicker(true)}
            >
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
            </TouchableOpacity>
            {showStartDatePicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display="default"
                    onChange={onStartDateChange}
                />
            )}

            <Text style={styles.label}>Data de término</Text>
            <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowEndDatePicker(true)}
            >
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
            </TouchableOpacity>
            {showEndDatePicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    display="default"
                    onChange={onEndDateChange}
                />
            )}

            <Text style={styles.label}>Dias da semana</Text>
            <View style={styles.weekDaysContainer}>
                {weekDays.map((day) => (
                    <TouchableOpacity
                        key={day.value}
                        style={[
                            styles.weekDayButton,
                            weekDaysSelected.includes(day.value) && styles.weekDayButtonSelected,
                        ]}
                        onPress={() => toggleWeekDay(day.value)}
                    >
                        <Text style={styles.weekDayText}>{day.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Minutos por dia</Text>
            <TextInput
                style={styles.input}
                placeholder="Ex: 30"
                keyboardType="numeric"
                value={minutesPerDay}
                onChangeText={setMinutesPerDay}
            />

            <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Criar Plano de Estudos</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    navigation.goBack();
                }}>
                <Text style={styles.buttonText}>Voltar</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, backgroundColor: "#f5f5f5", flexGrow: 1 },
    label: { fontSize: 16, fontWeight: "600", marginTop: 20 },
    input: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 10,
        marginTop: 5,
    },
    dateButton: {
        backgroundColor: "#fff",
        borderRadius: 10,
        padding: 15,
        marginTop: 5,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    dateText: {
        fontSize: 16,
        color: "#333",
    },
    weekDaysContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
    weekDayButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: "#e6e6e6",
        margin: 5,
    },
    weekDayButtonSelected: { backgroundColor: "#3b82f6" },
    weekDayText: { color: "#000", fontWeight: "600" },
    button: {
        marginTop: 30,
        backgroundColor: "#3b82f6",
        padding: 15,
        borderRadius: 12,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});