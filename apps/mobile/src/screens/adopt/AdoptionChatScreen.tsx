import Feather from "@expo/vector-icons/Feather";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from "@react-navigation/native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackButton } from "@/components/BackButton";
import { Text } from "@/components/Themed";
import { useAdoptionChat } from "@/hooks/useAdoption";
import { supabase } from "@/lib/supabase";
import type { AdoptStackParamList } from "@/src/navigation/types";
import { APPLICATION_STATUS_LABELS } from "@/types/adoption";

type Nav = NativeStackNavigationProp<AdoptStackParamList, "AdoptionChat">;
type Route = RouteProp<AdoptStackParamList, "AdoptionChat">;

export default function AdoptionChatScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { messages, loading, sendMessage } = useAdoptionChat(
    params.applicationId,
  );
  const [text, setText] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage(text);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topRow}>
        <BackButton onFallback={() => navigation.goBack()} />
        <Text style={styles.title}>{params.title} · Adoption</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Application conversation · {APPLICATION_STATUS_LABELS.under_review}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#7C3AED" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          renderItem={({ item }) => {
            const mine = item.senderId === userId;
            return (
              <View
                style={[
                  styles.bubble,
                  mine ? styles.bubbleMine : styles.bubbleOther,
                ]}
              >
                <Text
                  style={[styles.bubbleText, mine && styles.bubbleTextMine]}
                >
                  {item.body}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Say hello to start the conversation.
            </Text>
          }
        />
      )}

      <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message…"
          style={styles.input}
          multiline
        />
        <Pressable
          style={styles.sendBtn}
          onPress={handleSend}
          disabled={sending}
        >
          <Feather name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F9FAFB" },
  topRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "600" },
  statusBar: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FEF3C7",
  },
  statusText: { fontSize: 12, color: "#92400E", textAlign: "center" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 24 },
  bubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: "#7C3AED" },
  bubbleOther: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bubbleText: { fontSize: 15, color: "#111827" },
  bubbleTextMine: { color: "#FFFFFF" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FAFAFA",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
});
