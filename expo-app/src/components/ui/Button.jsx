import { Pressable, Text, View, ActivityIndicator } from "react-native";

const VARIANT = {
  default: { box: "bg-primary", text: "text-primary-foreground" },
  outline: { box: "bg-card border border-border", text: "text-foreground" },
  ghost: { box: "bg-transparent", text: "text-foreground" },
  destructive: { box: "bg-destructive", text: "text-destructive-foreground" },
  success: { box: "bg-success", text: "text-success-foreground" },
};

const SIZE = {
  default: "px-4 py-3 rounded-xl",
  sm: "px-3 py-2 rounded-lg",
  lg: "px-5 py-4 rounded-2xl",
};

export function Button({
  children,
  onPress,
  variant = "default",
  size = "default",
  disabled,
  loading,
  className = "",
  leftIcon,
}) {
  const v = VARIANT[variant] || VARIANT.default;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${v.box} ${SIZE[size]} ${disabled || loading ? "opacity-50" : ""} ${className}`}
      style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
    >
      <View className="flex-row items-center justify-center gap-2">
        {loading ? <ActivityIndicator size="small" color="#fff" /> : leftIcon}
        <Text className={`text-sm font-semibold ${v.text}`}>{children}</Text>
      </View>
    </Pressable>
  );
}