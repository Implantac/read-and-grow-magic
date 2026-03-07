import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { mockUser, mockCompanies } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUser, setActiveCompany } = useAppStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (email === 'admin@empresa.com' && password === 'admin123') {
      setUser(mockUser);
      setActiveCompany(mockCompanies[0]);
      toast({ title: 'Bem-vindo!', description: `Olá, ${mockUser.name}` });
      navigate('/dashboard');
    } else {
      toast({ title: 'Erro de autenticação', description: 'Email ou senha inválidos', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: 'Erro', description: 'Informe seu email', variant: 'destructive' });
      return;
    }
    setIsResetting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsResetting(false);
    toast({
      title: 'Email enviado',
      description: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.',
    });
    setShowForgotPassword(false);
    setResetEmail('');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">E</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">ERP+WMS</h1>
          <p className="text-muted-foreground">Enterprise System</p>
        </div>

        <Card className="border-border/50 shadow-xl">
          {showForgotPassword ? (
            <>
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForgotPassword(false)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
                    <CardDescription>Informe seu email para receber instruções</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="pl-10"
                        disabled={isResetting}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isResetting}>
                    {isResetting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                    ) : 'Enviar Link de Recuperação'}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>Entre com suas credenciais para acessar o sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs text-primary hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</>
                    ) : 'Entrar'}
                  </Button>
                </form>

                <div className="mt-6 rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium text-muted-foreground">Credenciais de teste:</p>
                  <p className="mt-1 text-sm text-foreground">
                    Email: <code className="rounded bg-background px-1">admin@empresa.com</code>
                  </p>
                  <p className="text-sm text-foreground">
                    Senha: <code className="rounded bg-background px-1">admin123</code>
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          © 2024 ERP+WMS Enterprise. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
