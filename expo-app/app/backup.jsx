import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { Download, Upload, Trash2 } from "lucide-react-native";
import { Screen } from "../src/components/Screen";
import { Card } from "../src/components/ui/Card";
import { Button } from "../src/components/ui/Button";
import { DB_NAME, closeDb, getDb, wipeDb } from "../src/lib/db";

const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

export default function Backup() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      const ts = new Date().toISOString().slice(0, 10);
      const dest = `${FileSystem.cacheDirectory}ledger-backup-${ts}.db`;
      await FileSystem.copyAsync({ from: DB_PATH, to: dest });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(dest, { mimeType: "application/x-sqlite3", dialogTitle: "Save backup" });
      } else {
        Alert.alert("Backup saved", `Saved at ${dest}`);
      }
    } catch (e) {
      Alert.alert("Backup failed", e.message);
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    setBusy(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
      if (res.canceled) return;
      const src = res.assets[0].uri;
      closeDb();
      await FileSystem.deleteAsync(DB_PATH, { idempotent: true });
      await FileSystem.copyAsync({ from: src, to: DB_PATH });
      getDb();
      Alert.alert("Restored", "Backup loaded successfully.");
      router.replace("/(tabs)/dashboard");
    } catch (e) {
      Alert.alert("Restore failed", "Is this a valid backup file?");
    } finally {
      setBusy(false);
    }
  };

  const wipe = () => {
    Alert.alert("Delete all data?", "Your records, inventory and reports will be permanently removed from this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, delete",
        style: "destructive",
        onPress: async () => {
          await wipeDb();
          router.replace("/setup");
        },
      },
    ]);
  };

  return (
    <Screen title="Backup & restore">
      <Card title="Download a backup" className="mb-4">
        <Text className="text-sm text-muted-foreground mb-3">
          Exports your entire database as a single .db file. Save it to Google Drive, iCloud or email it to yourself.
        </Text>
        <Button onPress={download} loading={busy} leftIcon={<Download size={16} color="#fff" />}>Download backup</Button>
      </Card>

      <Card title="Restore from a backup" className="mb-4">
        <Text className="text-sm text-muted-foreground mb-3">
          Replaces all current data with the contents of a backup file. Make a backup first if you're unsure.
        </Text>
        <Button variant="outline" onPress={restore} loading={busy} leftIcon={<Upload size={16} color="#0F1F3D" />}>Choose backup file</Button>
      </Card>

      <Card title="Reset all data">
        <Text className="text-sm text-muted-foreground mb-3">Clears every record on this device. This cannot be undone.</Text>
        <Button variant="destructive" onPress={wipe} leftIcon={<Trash2 size={16} color="#fff" />}>Delete everything</Button>
      </Card>
    </Screen>
  );
}