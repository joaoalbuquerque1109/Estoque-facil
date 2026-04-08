"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  MailCheck,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Warehouse,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthMode = "login" | "register";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = React.useState<AuthMode>("login");
  const [form, setForm] = React.useState(initialForm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [isResendingConfirmation, setIsResendingConfirmation] = React.useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }

        if (data.session) {
          router.replace("/dashboard");
          return;
        }

        setIsCheckingSession(false);
      })
      .catch(() => {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const isEmailNotConfirmedError = (error: unknown) => {
    return error instanceof Error && error.message.toLowerCase().includes("email not confirmed");
  };

  const handleResendConfirmation = async (emailOverride?: string) => {
    const email = (emailOverride ?? pendingConfirmationEmail ?? form.email).trim();

    if (!email) {
      throw new Error("Informe o email para reenviar a confirmacao.");
    }

    setIsResendingConfirmation(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        throw error;
      }

      setPendingConfirmationEmail(email);
      toast({
        title: "Email reenviado",
        description: "Verifique sua caixa de entrada e confirme o cadastro antes de entrar.",
        variant: "success",
      });
    } finally {
      setIsResendingConfirmation(false);
    }
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (error) {
      throw error;
    }

    toast({
      title: "Login realizado",
      description: "Redirecionando para o dashboard.",
      variant: "success",
    });
    router.replace("/dashboard");
  };

  const handleRegister = async () => {
    if (form.password.length < 6) {
      throw new Error("A senha precisa ter pelo menos 6 caracteres.");
    }

    if (form.password !== form.confirmPassword) {
      throw new Error("As senhas nao coincidem.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: form.name.trim() ? { name: form.name.trim() } : undefined,
      },
    });

    if (error) {
      throw error;
    }

    if (data.session) {
      setPendingConfirmationEmail("");
      toast({
        title: "Usuario criado",
        description: "A conta foi criada e o acesso foi liberado.",
        variant: "success",
      });
      router.replace("/dashboard");
      return;
    }

    setPendingConfirmationEmail(form.email.trim());
    setMode("login");
    setForm((current) => ({
      ...current,
      password: "",
      confirmPassword: "",
    }));

    toast({
      title: "Cadastro concluido",
      description: "Conta criada. Se o Supabase exigir confirmacao por email, confirme antes de entrar.",
      variant: "success",
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await handleLogin();
      } else {
        await handleRegister();
      }
    } catch (error) {
      if (isEmailNotConfirmedError(error)) {
        const email = form.email.trim();
        setPendingConfirmationEmail(email);
        toast({
          title: "Email nao confirmado",
          description: "Confirme o email cadastrado antes de entrar. Se precisar, reenvie a confirmacao abaixo.",
          variant: "destructive",
        });
        return;
      }

      const description =
        error instanceof Error
          ? error.message
          : mode === "login"
            ? "Verifique suas credenciais e tente novamente."
            : "Nao foi possivel concluir o cadastro.";

      toast({
        title: mode === "login" ? "Falha no login" : "Falha no cadastro",
        description,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(135deg,#082f49_0%,#e0f2fe_52%,#f8fafc_100%)] px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.35),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(34,197,94,0.18),transparent_28%)]" />

      <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden rounded-[32px] border border-white/15 bg-slate-950/85 p-10 text-white shadow-2xl backdrop-blur lg:flex lg:min-h-[720px] lg:flex-col lg:justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-300/20">
                <Warehouse className="h-7 w-7 text-sky-200" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-200/75">AlmoxFlow</p>
                <h1 className="text-3xl font-semibold tracking-tight">Controle seu estoque com acesso organizado</h1>
              </div>
            </div>

            <p className="max-w-xl text-base leading-7 text-slate-300">
              Entre para acompanhar o almoxarifado ou crie um novo usuario para liberar mais um acesso ao sistema.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <span className="text-sm font-medium text-slate-100">Acesso por perfil</span>
              </div>
              <p className="text-sm leading-6 text-slate-300">
                O login usa o Supabase e o novo usuario ja nasce com permissao padrao de operador.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
              <div>
                <p className="text-sm text-slate-300">Fluxo rapido</p>
                <p className="text-lg font-semibold text-white">Entrar ou cadastrar em um so lugar</p>
              </div>
              <ArrowRight className="h-5 w-5 text-sky-200" />
            </div>
          </div>
        </section>

        <Card className="mx-auto w-full max-w-xl border-white/60 bg-white/88 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-4 pb-2">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100">
                <Warehouse className="h-6 w-6 text-sky-700" />
              </div>
              <div>
                <CardTitle className="text-2xl">AlmoxFlow</CardTitle>
                <CardDescription>Entre ou crie um usuario para acessar o sistema.</CardDescription>
              </div>
            </div>

            <div className="hidden lg:block">
              <CardTitle className="text-3xl tracking-tight">Acesso ao sistema</CardTitle>
              <CardDescription className="mt-2 text-base">
                Escolha se voce quer entrar com uma conta existente ou criar um novo usuario.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <Tabs value={mode} onValueChange={(value) => setMode(value as AuthMode)}>
              <TabsList className="grid h-12 w-full grid-cols-2 rounded-xl bg-slate-100 p-1">
                <TabsTrigger value="login" className="rounded-lg">
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Criar usuario
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="voce@empresa.com"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={form.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        disabled={isSubmitting}
                        className="pr-11"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    Entrar
                  </Button>

                  {pendingConfirmationEmail ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                      <div className="mb-2 flex items-center gap-2 font-medium">
                        <MailCheck className="h-4 w-4" />
                        Confirmacao pendente para {pendingConfirmationEmail}
                      </div>
                      <p className="mb-3 text-amber-900">
                        O Supabase exige confirmacao por email antes do primeiro login.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={isResendingConfirmation}
                        onClick={() => void handleResendConfirmation()}
                      >
                        {isResendingConfirmation ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        Reenviar confirmacao
                      </Button>
                    </div>
                  ) : null}
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-6">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="Nome do usuario"
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="novo.usuario@empresa.com"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Minimo de 6 caracteres"
                        value={form.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        disabled={isSubmitting}
                        className="pr-11"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmar senha</Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repita a senha"
                        value={form.confirmPassword}
                        onChange={(event) => updateField("confirmPassword", event.target.value)}
                        disabled={isSubmitting}
                        className="pr-11"
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition hover:text-foreground"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    Criar usuario
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
