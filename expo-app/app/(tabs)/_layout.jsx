import { Tabs } from "expo-router";
import { LayoutDashboard, ShoppingCart, Receipt, FileBarChart } from "lucide-react-native";
import { useProfile } from "../../src/lib/use-db";

export default function TabsLayout() {
  const { profile } = useProfile();
  const serviceOnly = profile?.business_type === "services";
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0F1F3D",
        tabBarInactiveTintColor: "#9AA5BC",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#DBE0EC",
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <LayoutDashboard size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: serviceOnly ? "Services" : "Sales",
          tabBarIcon: ({ color }) => <ShoppingCart size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          title: "Expenses",
          tabBarIcon: ({ color }) => <Receipt size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color }) => <FileBarChart size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}