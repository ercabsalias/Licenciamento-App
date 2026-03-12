import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useLogin } from "@/services/api/hooks";
import { apiClient } from "@/services/api/client";
import logo from "@/assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const loginMutation = useLogin(); // ✅ ADICIONADO

  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("O campo utilizador é obrigatório.");
      return;
    }

    if (!password.trim()) {
      setError("O campo password é obrigatório.");
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({
        username: username.trim(),
        password: password.trim(),
      });

      // Guardar token e dados do utilizador
      localStorage.setItem("auth_token", result.token);
      // set token on shared api client so further calls include it
      apiClient.setToken(result.token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: result.id,
          utilizador: result.username,
          nome: `${result.firstName} ${result.lastName}`,
          firstName: result.firstName,
          lastName: result.lastName,
          username: result.username,
        })
      );

      // Redirecionar para dashboard
      navigate("/app");
    } catch (err) {
      console.error("Erro de login:", err);

      if (err instanceof Error) {
        // show the message directly, fallback generic if empty
        const msg = err.message || "Erro ao fazer login";
        setError(msg);
      } else {
        setError("Erro desconhecido ao fazer login. Tente novamente.");
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Hero */}
      <div className="hidden lg:flex lg:w-[60%] relative gradient-primary items-center justify-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
          alt="Licenciamento"
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="relative z-10 p-12 max-w-xl text-center">
          <img src={logo} alt="Licenciamento" className="h-16 mx-auto mb-8" />
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            Licenciamento
          </h1>
          <p className="text-primary-foreground/80 text-lg">
            Plataforma integrada de licenciamento.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex justify-center mb-6">
            <img src={logo} alt="Licenciamento" className="h-12" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Bem-vindo
            </h2>
            <p className="text-muted-foreground mt-1">
              Introduza as suas credenciais para aceder ao sistema.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Utilizador</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu utilizador"
                className="h-11"
                disabled={loginMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 pr-10"
                  disabled={loginMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loginMutation.isPending}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-accent hover:underline"
              >
                Esqueci a senha
              </button>
            </div>

            

            <Button
              type="submit"
              className="w-full h-11"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              {loginMutation.isPending ? "A entrar..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground pt-4">
            Licenciamento © 2025 — Openlimits
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;