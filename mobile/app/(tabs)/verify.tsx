import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Card, Screen } from "@/components/Screen";
import { lookupPhone, type PhoneProfile } from "@/lib/api";
import { getMessageMeta } from "@/lib/message";
import { normalizePhone } from "@/lib/phone";
import { markCommercial } from "@/lib/screening";
import { colors } from "@/theme";

export default function VerifyScreen() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<PhoneProfile | null>(null);

  async function onAnalyze() {
    const phone = normalizePhone(input);
    if (!phone) {
      Alert.alert("Numéro invalide", "Ex. 06 12 34 56 78 ou +33612345678");
      return;
    }
    setInput(phone);
    setLoading(true);
    setProfile(null);
    try {
      setProfile(await lookupPhone(phone));
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Échec");
    } finally {
      setLoading(false);
    }
  }

  async function onMarkCommercial() {
    if (!profile?.phone) return;
    const meta = await getMessageMeta();
    await markCommercial(profile.phone, meta?.uri ?? null);
    Alert.alert("Ajouté", `${profile.phone} sera bloqué si la protection est active.`);
  }

  return (
    <Screen title="Vérifier un numéro" subtitle="OSINT Teloscope / VocalGuard (démo si API non configurée).">
      <Card>
        <TextInput
          style={styles.input}
          placeholder="+33 6 12 34 56 78"
          placeholderTextColor={colors.muted}
          keyboardType="phone-pad"
          value={input}
          onChangeText={setInput}
        />
        <Pressable style={styles.btn} onPress={onAnalyze} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#0a1210" />
          ) : (
            <Text style={styles.btnText}>Analyser</Text>
          )}
        </Pressable>
      </Card>

      {profile ? (
        <Card>
          <View style={styles.row}>
            <Text style={styles.phone}>{profile.phone}</Text>
            {profile.mode === "demo" ? (
              <Text style={styles.pillDemo}>Démo</Text>
            ) : (
              <Text style={styles.pillLive}>API</Text>
            )}
          </View>
          <Text style={styles.summary}>{profile.summary}</Text>
          <Text style={styles.line}>
            {profile.line?.type} · {profile.line?.carrier} · {profile.line?.region}
          </Text>
          <Text style={styles.line}>
            Spam {profile.reputation?.spam_score ?? "—"}/100 ({profile.reputation?.label})
          </Text>
          {profile.osint?.sources_checked?.length ? (
            <Text style={styles.line}>
              Sources : {profile.osint.sources_checked.join(" · ")}
            </Text>
          ) : null}
          <Text style={styles.reco}>{profile.recommendation}</Text>
          {(profile.isCommercial || (profile.reputation?.spam_score ?? 0) > 55) && (
            <Pressable style={[styles.btn, styles.btnSecondary]} onPress={onMarkCommercial}>
              <Text style={styles.btnTextSecondary}>Bloquer ce numéro (commercial)</Text>
            </Pressable>
          )}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "rgba(125,211,192,0.25)",
    borderRadius: 8,
    padding: 12,
    color: colors.fg,
    marginBottom: 12,
    fontSize: 16,
  },
  btn: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: 12,
  },
  btnText: { color: "#0a1210", fontWeight: "600", fontSize: 16 },
  btnTextSecondary: { color: colors.accent, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  phone: { fontSize: 18, fontWeight: "600", color: colors.fg, flex: 1 },
  pillDemo: {
    fontSize: 10,
    textTransform: "uppercase",
    color: colors.warn,
    backgroundColor: "rgba(232,200,122,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillLive: {
    fontSize: 10,
    textTransform: "uppercase",
    color: colors.accent,
    backgroundColor: "rgba(125,211,192,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  summary: { color: colors.fg, marginBottom: 8 },
  line: { color: colors.muted, fontSize: 14, marginBottom: 4 },
  reco: { color: colors.muted, fontSize: 14, marginTop: 8, fontStyle: "italic" },
});
