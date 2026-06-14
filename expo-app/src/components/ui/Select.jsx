import { useState } from "react";
import { Modal, Pressable, Text, View, FlatList } from "react-native";
import { ChevronDown, Check } from "lucide-react-native";

/**
 * Bottom-sheet style picker — works on every platform without native deps.
 * options: [{ value, label }]
 */
export function Select({ value, onChange, options, placeholder = "Select…" }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="bg-card border border-border rounded-xl px-3.5 py-3 flex-row items-center justify-between"
      >
        <Text className={`text-base ${current ? "text-foreground" : "text-muted-foreground"}`}>
          {current?.label || placeholder}
        </Text>
        <ChevronDown size={18} color="#5B6A86" />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 bg-black/40 justify-end" onPress={() => setOpen(false)}>
          <Pressable className="bg-card rounded-t-3xl pt-2 pb-6" onPress={() => {}}>
            <View className="self-center w-10 h-1 bg-muted rounded-full mb-2" />
            <FlatList
              data={options}
              keyExtractor={(o) => String(o.value)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="flex-row items-center justify-between px-5 py-3.5 border-b border-border"
                >
                  <Text className="text-base text-foreground">{item.label}</Text>
                  {value === item.value ? <Check size={18} color="#0F1F3D" /> : null}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}