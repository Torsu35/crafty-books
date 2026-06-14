import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text } from "react-native";
import { StatusBar } from "expo-status-bar";

export function Screen({ title, action, children, scroll = true, padded = true }) {
  const Body = scroll ? ScrollView : View;
  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <StatusBar style="dark" />
      {title ? (
        <View className="flex-row items-center justify-between px-4 pt-2 pb-3 border-b border-border bg-card">
          <Text className="text-lg font-bold text-foreground">{title}</Text>
          {action}
        </View>
      ) : null}
      <Body
        className="flex-1"
        contentContainerClassName={padded ? "p-4 pb-10" : undefined}
        contentContainerStyle={scroll ? undefined : { flex: 1 }}
      >
        {children}
      </Body>
    </SafeAreaView>
  );
}