import { useEffect, useState, useCallback } from "react";
import { View, Image, Text, Button, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import { AuthUtils } from "../utils/auth";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { api } from "../api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Profile">;

export default function UserProfile() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<NavigationProp>();

    const fetchUserData = async () => {
        try {
            const token = await AuthUtils.getToken();
            const res = await api.get("/user", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data);
        } catch (err) {
            console.error(err);
            Alert.alert("Erro", "Não foi possível carregar o usuário.");
        } finally {
            setLoading(false);
        }
    };

    // Atualiza quando a tela ganha foco
    useFocusEffect(
        useCallback(() => {
            fetchUserData();
        }, [])
    );

    const handleEquip = async (itemId: number) => {
        try {
            const token = await AuthUtils.getToken();
            const res = await api.post(
                `/users/${user.user_id}/equip`,
                { item_id: itemId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser(res.data); // agora res.data é o usuário completo atualizado
            Alert.alert("Sucesso", "Item equipado!");
        } catch (err: any) {
            console.error(err);
            Alert.alert("Erro", err.response?.data?.message || "Não foi possível equipar o item.");
        }
    };

    const handleUnequip = async (slot: string) => {
        try {
            const token = await AuthUtils.getToken();
            const res = await api.post(
                `/users/${user.user_id}/unequip`,
                { slot },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUser(res.data);
            Alert.alert("Sucesso", "Item desequipado!");
        } catch (err: any) {
            console.error(err);
            Alert.alert("Erro", err.response?.data?.message || "Não foi possível desequipar o item.");
        }
    };


    if (loading) {
        return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center" }} />;
    }

    if (!user) {
        return <Text>Usuário não encontrado</Text>;
    }

    const equippedItems = [
        user.item_body,
        user.item_face,
        user.item_skin_top,
        user.item_skin_bottom,
        user.item_shoes,
        user.item_hair,
        user.item_accessory,
        user.item_hand_accessory,
    ].filter(Boolean);

    return (
        <ScrollView style={{ padding: 20 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold" }}>{user.name}</Text>
            <Text>Pontos: {user.points}</Text>

            {/* Botão para Loja */}
            <TouchableOpacity
                style={{
                    marginVertical: 15,
                    backgroundColor: "#3b82f6",
                    padding: 10,
                    borderRadius: 8,
                    alignItems: "center",
                }}
                onPress={() => navigation.navigate("ShopScreen")}
            >
                <Text style={{ color: "white", fontWeight: "bold" }}>Ir para a Loja</Text>
            </TouchableOpacity>

            {/* Personagem */}
            <Text style={{ marginTop: 20, fontSize: 18, fontWeight: "600" }}>Seu Personagem</Text>
            <View style={{ width: 200, height: 300, position: "relative", alignSelf: "center", marginVertical: 20 }}>
                {equippedItems.map((item: any, index: number) => {
                    const isDefault =
                        item.name === "Default Body" || item.name === "Default Face";

                    return (
                        <View key={index} style={{ alignItems: "center", marginBottom: 10 }}>
                            <Text style={{ fontSize: 18, fontWeight: "600" }}>{item.name}</Text>
                            <Image
                                source={{ uri: item.image_url }}
                                style={{
                                    position: "absolute",
                                    width: "100%",
                                    height: "100%",
                                    resizeMode: "contain",
                                }}
                            />
                            {!isDefault && (
                                <Button title="Desequipar" onPress={() => handleUnequip(item.slot)} />
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Inventário */}
            <Text style={{ fontSize: 18, fontWeight: "600" }}>Inventário</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {user.Inventory.map((inv: any, index: number) => {
                    const item = inv.item;
                    const isEquipped =
                        user.item_body?.item_id === item.item_id ||
                        user.item_face?.item_id === item.item_id ||
                        user.item_skin_top?.item_id === item.item_id ||
                        user.item_skin_bottom?.item_id === item.item_id ||
                        user.item_shoes?.item_id === item.item_id ||
                        user.item_hair?.item_id === item.item_id ||
                        user.item_accessory?.item_id === item.item_id ||
                        user.item_hand_accessory?.item_id === item.item_id;

                    const isDefault =
                        item.name === "Default Body" || item.name === "Default Face";

                    return (
                        <View key={index} style={{ margin: 10, alignItems: "center" }}>
                            <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.name}</Text>
                            <Image
                                source={{ uri: item.image_url }}
                                style={{ width: 60, height: 60, borderRadius: 8 }}
                            />
                            {!isDefault && (
                                isEquipped ? (
                                    <Button title="Desequipar" onPress={() => handleUnequip(item.slot)} />
                                ) : (
                                    <Button title="Equipar" onPress={() => handleEquip(item.item_id)} />
                                )
                            )}
                        </View>
                    );
                })}
            </View>
            <TouchableOpacity
                onPress={() => {
                    navigation.goBack();
                }}>
                <Text>Voltar</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
