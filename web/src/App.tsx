import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Chat } from "./components/Chat";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Admin } from "./pages/Admin";

function useAuth() {
  const token = localStorage.getItem("token");
  return { token };
}

function Protected({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-zinc-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <Link to="/" className="font-semibold">BahChat AI</Link>
          <nav className="ml-auto flex items-center gap-4 text-sm text-zinc-300">
            <Link to="/admin">Admin</Link>
            <button
              onClick={() => {
                if (document.documentElement.classList.contains("dark")) {
                  document.documentElement.classList.remove("dark");
                } else {
                  document.documentElement.classList.add("dark");
                }
              }}
              className="rounded border border-zinc-700 px-2 py-1 hover:bg-zinc-800"
            >
              Modo
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Protected><Chat /></Protected>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<Protected><Admin /></Protected>} />
        </Routes>
      </main>
    </div>
  );
}
