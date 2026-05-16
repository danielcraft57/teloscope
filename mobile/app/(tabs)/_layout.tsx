import { Tabs } from "expo-router";
import { colors } from "@/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: "rgba(125,211,192,0.12)",
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.fg,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Protection", tabBarLabel: "Accueil" }} />
      <Tabs.Screen name="verify" options={{ title: "Vérifier", tabBarLabel: "Vérifier" }} />
      <Tabs.Screen name="message" options={{ title: "Message", tabBarLabel: "Message" }} />
      <Tabs.Screen name="journal" options={{ title: "Journal", tabBarLabel: "Journal" }} />
    </Tabs>
  );
}
