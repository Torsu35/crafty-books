import { View, Text } from "react-native";

export function Card({ title, action, children, className = "" }) {
  return (
    <View className={`bg-card rounded-2xl border border-border p-4 ${className}`}>
      {(title || action) && (
        <View className="flex-row items-center justify-between mb-3">
          {typeof title === "string" ? (
            <Text className="text-sm font-semibold text-foreground">{title}</Text>
          ) : (
            title
          )}
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

export function StatCard({ label, value, hint, tone = "default" }) {
  const ring =
    tone === "primary"
      ? "border-primary/30 bg-primary"
      : tone === "success"
        ? "border-success/30"
        : "border-border";
  const valColor =
    tone === "primary" ? "text-primary-foreground" : "text-foreground";
  const labelColor =
    tone === "primary" ? "text-primary-foreground/70" : "text-muted-foreground";
  return (
    <View className={`flex-1 rounded-2xl border p-3.5 ${ring}`}>
      <Text className={`text-[11px] uppercase tracking-wider font-semibold ${labelColor}`}>
        {label}
      </Text>
      <Text className={`mt-1 text-lg font-bold ${valColor}`} numberOfLines={1}>
        {value}
      </Text>
      {hint ? (
        <Text className={`mt-0.5 text-[11px] ${labelColor}`} numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <View className="items-center justify-center py-10 px-6">
      <Text className="text-base font-semibold text-foreground text-center">{title}</Text>
      {description ? (
        <Text className="mt-1.5 text-sm text-muted-foreground text-center">{description}</Text>
      ) : null}
      {action ? <View className="mt-4">{action}</View> : null}
    </View>
  );
}