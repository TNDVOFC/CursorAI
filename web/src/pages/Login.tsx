import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { login } from "../lib/api";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation() as any;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Falha no login");
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-xl font-semibold mb-4">Entrar</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2" placeholder="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button className="rounded bg-blue-600 hover:bg-blue-500 px-4 py-2">Entrar</button>
      </form>
      <p className="mt-3 text-sm text-zinc-400">Não tem conta? <Link className="underline" to="/register">Registrar</Link></p>
    </div>
  );
}
