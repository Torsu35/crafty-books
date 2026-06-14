import { Pressable, Text, View } from "react-native";

/**
 * Pill-style segmented radio.
 * options: [{ value, label }]
 */
export function RadioGroup({ value, onChange, options, columns = 3 }) {
  const colClass = columns === 2 ? "w-1/2" : "w-1/3";
  return (
    <View className="flex-row flex-wrap -mx-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <View key={o.value} className={`${colClass} px-1 mb-2`}>
            <Pressable
              onPress={() => onChange(o.value)}
              className={`rounded-xl border px-3 py-3 items-center ${
                active ? "bg-primary border-primary" : "bg-card border-border"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  active ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {o.label}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}