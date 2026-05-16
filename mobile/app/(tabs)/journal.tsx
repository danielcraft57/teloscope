import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Screen } from "@/components/Screen";
import { refreshBlockLogFromNative } from "@/lib/screening";
import { getBlockLog, type BlockLogEntry } from "@/lib/storage";
import { colors } from "@/theme";

export default function JournalScreen() {
  const [entries, setEntries] = useState<BlockLogEntry[]>([]);

  const refresh = useCallback(async () => {
    await refreshBlockLogFromNative();
    setEntries(await getBlockLog());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <Screen
      title="Journal"
      subtitle="Appels commerciaux coupés par Teloscope (Android) ou marqués manuellement."
    >
      <Pressable style={styles.refresh} onPress={refresh}>
        <Text style={styles.refreshText}>Actualiser</Text>
      </Pressable>

      {entries.length === 0 ? (
        <Card>
          <Text style={styles.empty}>Aucun blocage enregistré pour le moment.</Text>
        </Card>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Card>
              <Text style={styles.phone}>{item.phone}</Text>
              <Text style={styles.date}>{new Date(item.at).toLocaleString("fr-FR")}</Text>
              <Text style={styles.reason}>{item.reason}</Text>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  refresh: { alignSelf: "flex-start", marginBottom: 12 },
  refreshText: { color: colors.accent, fontWeight: "500" },
  empty: { color: colors.muted },
  phone: { color: colors.fg, fontWeight: "600", fontSize: 16 },
  date: { color: colors.muted, fontSize: 13, marginTop: 4 },
  reason: { color: colors.muted, fontSize: 14, marginTop: 6 },
});
