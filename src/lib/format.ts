// Money helpers — store as integer pesewas (1 GHS = 100 pesewas)
export const toPesewas = (s: string | number): number => {
  const n = typeof s === "number" ? s : parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
};

export const fromPesewas = (p: number): number => (p || 0) / 100;

export const formatGHS = (pesewas: number): string => {
  const v = fromPesewas(pesewas);
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2,
  }).format(v);
};

export const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-GH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const periodRange = (
  kind: "month" | "quarter" | "year",
  ref: Date = new Date(),
): { start: string; end: string; label: string } => {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  if (kind === "month") {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: start.toLocaleDateString("en-GH", { month: "long", year: "numeric" }),
    };
  }
  if (kind === "quarter") {
    const q = Math.floor(m / 3);
    const start = new Date(y, q * 3, 1);
    const end = new Date(y, q * 3 + 3, 0);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: `Q${q + 1} ${y}`,
    };
  }
  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: `Year ${y}`,
  };
};