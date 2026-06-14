import { TextInput, View, Text } from "react-native";

export function Input({ value, onChangeText, placeholder, keyboardType, className = "", ...rest }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9AA5BC"
      keyboardType={keyboardType}
      className={`bg-card border border-border rounded-xl px-3.5 py-3 text-base text-foreground ${className}`}
      {...rest}
    />
  );
}

export function Label({ children, className = "" }) {
  return (
    <Text className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 ${className}`}>
      {children}
    </Text>
  );
}

export function Field({ label, children }) {
  return (
    <View className="mb-3">
      <Label>{label}</Label>
      {children}
    </View>
  );
}