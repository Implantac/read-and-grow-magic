import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowLeft, UserPlus } from 'lucide-react';
import logoUseSistemas from '@/assets/logo.png';
import { useAuth } from '@/hooks/system/useAuth';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toastSuccess, toastError } from '@/lib/toastHelpers';

type View = 'login' | 'signup' | 'forgot';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppStore();
  const { signIn, signUp, resetPassword } = useAuth();

  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('Preencha todos os campos');
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
      toastSuccess('Bem-vindo!', 'Login realizado com sucesso');
      navigate('/dashboard');
    } catch (error: any) {
      toastError(error.message || 'Email ou senha inválidos', undefined, 'Erro de autenticação');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toastError('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      toastError('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email, password, name);
      toastSuccess('Conta criada!', 'Verifique seu email para confirmar o cadastro.');
      setView('login');
    } catch (error: any) {
      toastError(error.message, undefined, 'Erro ao criar conta');
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toastError('Informe seu email');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email);
      toastSuccess('Email enviado', 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.');
      setView('login');
    } catch (error: any) {
      toastError(error.message);
    }
    setIsLoading(false);
  };

  const inputClasses = "pl-10 h-11 bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/30 focus:border-primary focus:ring-primary/20 transition-colors";

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 overflow-hidden bg-sidebar">
      {/* Ambient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/3 -right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, hsl(36 100% 50%), transparent 70%)' }} />
        <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, hsl(207 90% 54%), transparent 70%)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(hsl(210 40% 98%) 1px, transparent 1px), linear-gradient(90deg, hsl(210 40% 98%) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative w-full max-w-[420px]" style={{ animation: 'login-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards', opacity: 0 }}>
        {/* Logo & Title */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-2 ring-primary/20"
            style={{ animation: 'login-logo-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards', opacity: 0 }}
          >
            <img src={logoUseSistemas} alt="Use Sistemas" className="h-14 w-14 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-sidebar-foreground tracking-tight" style={{ animation: 'login-fade-in 0.5s ease-out 0.5s forwards', opacity: 0 }}>
            Use Sistemas
          </h1>
          <p className="text-primary font-semibold text-sm mt-1" style={{ animation: 'login-fade-in 0.5s ease-out 0.6s forwards', opacity: 0 }}>
            ERP e WMS
          </p>
        </div>

        {/* Card */}
        <Card
          className="border-sidebar-border/50 bg-sidebar-accent/30 backdrop-blur-xl shadow-2xl"
          style={{ animation: 'login-card-rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards', opacity: 0 }}
        >
          {view === 'forgot' ? (
            <>
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-sidebar-accent" onClick={() => setView('login')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-xl text-sidebar-foreground">Recuperar Senha</CardTitle>
                    <CardDescription className="text-sidebar-foreground/50 text-sm">Informe seu email para receber instruções</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-sidebar-foreground/70 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
                      <Input id="reset-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} disabled={isLoading} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Enviar Link de Recuperação'}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : view === 'signup' ? (
            <>
              <CardHeader className="space-y-1 pb-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-sidebar-accent" onClick={() => setView('login')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-xl text-sidebar-foreground">Criar Conta</CardTitle>
                    <CardDescription className="text-sidebar-foreground/50 text-sm">Preencha os dados para se cadastrar</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sidebar-foreground/70 text-sm">Nome</Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
                      <Input id="signup-name" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sidebar-foreground/70 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
                      <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sidebar-foreground/70 text-sm">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
                      <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className={cn(inputClasses, 'pr-10')} disabled={isLoading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : 'Criar Conta'}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl text-sidebar-foreground">Acessar Sistema</CardTitle>
                <CardDescription className="text-sidebar-foreground/50 text-sm">Entre com suas credenciais</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sidebar-foreground/70 text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
                      <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClasses} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sidebar-foreground/70 text-sm">Senha</Label>
                      <button type="button" onClick={() => setView('forgot')} className="text-xs text-primary hover:text-primary/80 transition-colors">Esqueceu a senha?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/70" />
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={cn(inputClasses, 'pr-10')} disabled={isLoading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-11 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : 'Entrar'}
                  </Button>
                </form>
                <div className="mt-5 text-center">
                  <span className="text-sm text-sidebar-foreground/40">Não tem conta? </span>
                  <button type="button" onClick={() => setView('signup')} className="text-sm text-primary font-medium hover:text-primary/80 transition-colors">Criar conta</button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="mt-6 text-center text-xs text-sidebar-foreground/30">
          © {new Date().getFullYear()} Use Sistemas. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
