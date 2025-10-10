import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function Admin() {
  const [stats, setStats] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get("/api/admin/stats").then(({ data }) => setStats(data)).catch((e) => setError(e?.response?.data?.error ?? "Erro"));
  }, []);

  if (error) return <div className="p-6">{error}</div>;
  if (!stats) return <div className="p-6">Carregando...</div>;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold mb-4">Estatísticas</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat label="Usuários" value={stats.users} />
        <Stat label="Conversas" value={stats.conversations} />
        <Stat label="Mensagens" value={stats.messages} />
        <Stat label="Requisições (24h)" value={stats.requestsLast24h} />
        <Stat label="Tempo médio (ms)" value={stats.avgDurationMs} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-zinc-800 p-4 bg-zinc-900">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
