// Money helpers — store as integer pesewas (1 GHS = 100 pesewas)
export const toPesewas = (s) => {
  const n = typeof s === "number" ? s : parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
};

export const fromPesewas = (p) => (p || 0) / 100;

export const formatGHS = (pesewas) => {
  const v = fromPesewas(pesewas);
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  const [whole, dec] = abs.toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}GH₵ ${grouped}.${dec}`;
};

export const formatDate = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const periodRange = (kind, ref = new Date()) => {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  if (kind === "month") {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
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