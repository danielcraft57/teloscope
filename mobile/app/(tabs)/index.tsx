import { useCallback, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Card, Screen } from "@/components/Screen";
import { getMessageMeta } from "@/lib/message";
import {
  enableProtection,
  hasScreeningRole,
  requestScreeningRole,
  screeningAvailable,
  syncScreeningRules,
} from "@/lib/screening";
import { isProtectionEnabled } from "@/lib/storage";
import { colors } from "@/theme";

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [role, setRole] = useState(false);
  const [hasMessage, setHasMessage] = useState(false);
  const android = Platform.OS === "android";
  const nativeOk = screeningAvailable();

  const refresh = useCallback(async () => {
    setLoading(true);
    setEnabled(await isProtectionEnabled());
    setRole(android && nativeOk ? await hasScreeningRole() : false);
    const meta = await getMessageMeta();
    setHasMessage(!!meta);
    setLoading(false);
  }, [android, nativeOk]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function onToggle(value: boolean) {
    if (android && nativeOk && value && !(await hasScreeningRole())) {
      const ok = await requestScreeningRole();
      if (!ok) {
        Alert.alert(
          "Rôle requis",
          "Activez Teloscope comme application de filtrage d'appels dans les paramètres Android."
        );
        return;
      }
      setRole(true);
    }
    const meta = await getMessageMeta();
    const path = meta?.uri ?? null;
    if (value && !path) {
      Alert.alert(
        "Message manquant",
        "Enregistrez d'abord un message dans l'onglet Message (référence pour les appels bloqués)."
      );
    }
    await enableProtection(value, path);
    await syncScreeningRules(path);
    setEnabled(value);
  }

  if (loading) {
    return (
      <Screen title="Teloscope" subtitle="Protection anti-appels commerciaux">
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  return (
    <Screen
      title="Teloscope"
      subtitle="Coupe les numéros commerciaux identifiés et journalise chaque blocage avec votre message enregistré."
    >
      <Card>
        <ViewRow
          label="Protection active"
          hint="Bloque les numéros de votre liste commerciale (Android, build natif)."
        >
          <Switch
            value={enabled}
            onValueChange={onToggle}
            trackColor={{ true: colors.accentDim }}
            disabled={android && !nativeOk}
          />
        </ViewRow>
      </Card>

      {android && !nativeOk ? (
        <Card>
          <Text style={styles.warn}>
            Filtrage d'appels indisponible dans Expo Go. Utilisez{" "}
            <Text style={styles.code}>npm run android</Text> (development build).
          </Text>
        </Card>
      ) : null}

      {android && nativeOk ? (
        <Card>
          <Text style={styles.label}>Rôle filtrage Android</Text>
          <Text style={styles.hint}>
            {role ? "Teloscope peut filtrer les appels." : "Autorisation requise pour couper les appels."}
          </Text>
          {!role ? (
            <Pressable style={styles.btn} onPress={() => requestScreeningRole().then(setRole)}>
              <Text style={styles.btnText}>Demander le rôle</Text>
            </Pressable>
          ) : null}
        </Card>
      ) : null}

      {!android ? (
        <Card>
          <Text style={styles.hint}>
            iOS : vérifiez les numéros et gérez votre message. Le blocage automatique est disponible sur Android ;
            sur iPhone, complétez avec le filtre matériel Teloscope.
          </Text>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.label}>Message commercial</Text>
        <Text style={styles.hint}>
          {hasMessage
            ? "Message enregistré — associé aux blocages (lecture côté matériel / évolution serveur)."
            : "Aucun message — enregistrez-le dans l'onglet Message."}
        </Text>
      </Card>

      <Card>
        <Text style={styles.label}>Fonctionnement</Text>
        <Text style={styles.hint}>
          1. Vérifiez un numéro (OSINT).{"\n"}
          2. Ajoutez-le comme commercial si besoin.{"\n"}
          3. Les appels correspondants sont coupés ; le journal conserve date et motif.
        </Text>
      </Card>
    </Screen>
  );
}

function ViewRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.hint}>{hint}</Text>
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.fg, fontWeight: "600", fontSize: 16, marginBottom: 6 },
  hint: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  warn: { color: colors.warn, fontSize: 14, lineHeight: 20 },
  code: { fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace", color: colors.accent },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  btnText: { color: "#0a1210", fontWeight: "600" },
});
