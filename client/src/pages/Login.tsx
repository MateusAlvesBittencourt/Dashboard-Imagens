import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";
import { ThemeToggle } from "@/components/ThemeToggle";

type LocalAuth = {
  username: string;
  name: string;
  role: "admin" | "user";
};

const FIXED_USERNAME = "mateus.bittencourt"; // comparar em minúsculas
const FIXED_PASSWORD = "Deploy@360";

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const inputUser = username.trim().toLowerCase();
      if (inputUser === FIXED_USERNAME && password === FIXED_PASSWORD) {
        const user: LocalAuth = {
          username: inputUser,
          name: "Mateus Bittencourt",
          role: "admin",
        };
        localStorage.setItem("local-auth", JSON.stringify(user));
        toast.success("Login realizado com sucesso");
        navigate("/");
      } else {
        toast.error("Usuário ou senha inválidos");
      }
    } finally {
      setLoading(false);
    }
  };

  // Se já estiver autenticado, evita pedir login novamente e redireciona
  useEffect(() => {
    try {
      const stored = localStorage.getItem("local-auth");
      if (stored) navigate("/");
    } catch {}
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">{APP_TITLE} — Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuário</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Mateus.bittencourt"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Botão de tema fixo no canto inferior direito */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeToggle />
      </div>
    </div>
  );
}
