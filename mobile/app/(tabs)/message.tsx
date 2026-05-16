import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";
import * as Speech from "expo-speech";
import { useFocusEffect } from "expo-router";
import { Card, Screen } from "@/components/Screen";
import {
  deleteMessage,
  getMessageMeta,
  messageFileUri,
  saveMessageMeta,
} from "@/lib/message";
import { syncScreeningRules } from "@/lib/screening";
import { colors } from "@/theme";

const DEFAULT_SCRIPT =
  "Bonjour. Les sollicitations commerciales ne sont pas acceptées sur cette ligne. Merci de ne pas rappeler.";

export default function MessageScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [meta, setMeta] = useState<{ updatedAt: string; durationMs?: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const m = await getMessageMeta();
    setMeta(m ? { updatedAt: m.updatedAt, durationMs: m.durationMs } : null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      return () => {
        sound?.unloadAsync();
      };
    }, [refresh, sound])
  );

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Microphone", "Autorisation requise pour enregistrer le message.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Enregistrement impossible");
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setBusy(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      if (!uri) throw new Error("Fichier audio manquant");
      const dest = await import("@/lib/message").then((m) => m.copyRecordingToMessage(uri));
      const durationMs =
        status.isRecording === false && status.durationMillis != null
          ? status.durationMillis
          : undefined;
      await saveMessageMeta({ uri: dest, updatedAt: new Date().toISOString(), durationMs });
      await syncScreeningRules(dest);
      setRecording(null);
      await refresh();
      Alert.alert("Enregistré", "Message associé aux blocages d'appels commerciaux.");
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : "Échec");
    } finally {
      setBusy(false);
    }
  }

  async function playRecording() {
    const uri = messageFileUri();
    const FileSystem = await import("expo-file-system/legacy");
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) {
      Alert.alert("Aucun fichier", "Enregistrez un message d'abord.");
      return;
    }
    if (sound) await sound.unloadAsync();
    const { sound: s } = await Audio.Sound.createAsync({ uri });
    setSound(s);
    await s.playAsync();
  }

  function previewTts() {
    Speech.speak(DEFAULT_SCRIPT, { language: "fr-FR" });
  }

  async function onDelete() {
    await deleteMessage();
    await syncScreeningRules(null);
    if (sound) await sound.unloadAsync();
    setSound(null);
    await refresh();
  }

  return (
    <Screen
      title="Message commercial"
      subtitle="Enregistrez le message lié aux appels bloqués. Lecture automatique à l'écouteur nécessite le boîtier Teloscope ou une évolution serveur ; ici vous préparez et testez le fichier."
    >
      <Card>
        <Text style={styles.scriptLabel}>Texte suggéré</Text>
        <Text style={styles.script}>{DEFAULT_SCRIPT}</Text>
        <Pressable style={styles.btnGhost} onPress={previewTts}>
          <Text style={styles.btnGhostText}>Écouter (synthèse vocale)</Text>
        </Pressable>
      </Card>

      <Card>
        {meta ? (
          <Text style={styles.meta}>
            Dernier enregistrement : {new Date(meta.updatedAt).toLocaleString("fr-FR")}
            {meta.durationMs ? ` · ${Math.round(meta.durationMs / 1000)} s` : ""}
          </Text>
        ) : (
          <Text style={styles.meta}>Aucun enregistrement pour l'instant.</Text>
        )}

        <View style={styles.row}>
          {!recording ? (
            <Pressable style={styles.btn} onPress={startRecording} disabled={busy}>
              <Text style={styles.btnText}>Enregistrer</Text>
            </Pressable>
          ) : (
            <Pressable style={[styles.btn, styles.btnStop]} onPress={stopRecording}>
              <Text style={styles.btnText}>Arrêter</Text>
            </Pressable>
          )}
          <Pressable style={styles.btnGhost} onPress={playRecording}>
            <Text style={styles.btnGhostText}>Écouter</Text>
          </Pressable>
        </View>

        {meta ? (
          <Pressable style={styles.delete} onPress={onDelete}>
            <Text style={styles.deleteText}>Supprimer le message</Text>
          </Pressable>
        ) : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scriptLabel: { color: colors.muted, fontSize: 12, marginBottom: 6 },
  script: { color: colors.fg, lineHeight: 22, marginBottom: 12 },
  meta: { color: colors.muted, marginBottom: 14, fontSize: 14 },
  row: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  btn: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  btnStop: { backgroundColor: "#c45c5c" },
  btnText: { color: "#0a1210", fontWeight: "600" },
  btnGhost: {
    borderWidth: 1,
    borderColor: "rgba(125,211,192,0.35)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  btnGhostText: { color: colors.accent, fontWeight: "500" },
  delete: { marginTop: 16 },
  deleteText: { color: colors.error, fontSize: 14 },
});
