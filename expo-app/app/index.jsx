import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useProfile } from "../src/lib/use-db";

export default function Index() {
  const router = useRouter();
  const { profile, loading } = useProfile();
  useEffect(() => {
    if (loading) return;
    router.replace(profile ? "/(tabs)/dashboard" : "/setup");
  }, [loading, profile, router]);
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center mb-3">
        <Text className="text-2xl font-bold text-primary-foreground">L</Text>
      </View>
      <ActivityIndicator color="#0F1F3D" />
      <Text className="mt-2 text-sm text-muted-foreground">Opening your books…</Text>
    </View>
  );
}