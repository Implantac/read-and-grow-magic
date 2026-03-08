import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowLeft, UserPlus } from 'lucide-react';
import logoUseSistemas from '@/assets/logo-use-sistemas.png';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/stores/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

type View = 'login' | 'signup' | 'forgot';

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Erro de autenticação', description: error.message || 'Email ou senha inválidos', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter no mínimo 6 caracteres', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await signUp(email, password, name);
      toast({ title: 'Conta criada!', description: 'Você já pode acessar o sistema.' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'Erro ao criar conta', description: error.message, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Erro', description: 'Informe seu email', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email);
      toast({ title: 'Email enviado', description: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.' });
      setView('login');
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #1a2234 0%, #2a3245 50%, #1a2234 100%)' }}>
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: 'rgba(255, 152, 0, 0.15)', border: '2px solid rgba(255, 152, 0, 0.3)' }}>
            <img src={logoUseSistemas} alt="Use Sistemas" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: '#ffffff' }}>Use Sistemas</h1>
          <p style={{ color: '#ff9800' }} className="font-medium">ERP e WMS</p>
        </div>

        <Card className="border-0 shadow-2xl" style={{ background: 'rgba(42, 50, 69, 0.95)', backdropFilter: 'blur(20px)' }}>
          {view === 'forgot' ? (
            <>
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" style={{ color: '#ff9800' }} onClick={() => setView('login')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-2xl" style={{ color: '#ffffff' }}>Recuperar Senha</CardTitle>
                    <CardDescription style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Informe seu email para receber instruções</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#ff9800' }} />
                      <Input id="reset-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 border-white/20 text-white placeholder:text-white/40 focus:border-[#ff9800] focus:ring-[#ff9800]" style={{ background: 'rgba(26, 34, 52, 0.8)' }} disabled={isLoading} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-semibold text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #ff9800, #e08800)' }} disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Enviar Link de Recuperação'}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : view === 'signup' ? (
            <>
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" style={{ color: '#ff9800' }} onClick={() => setView('login')}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-2xl" style={{ color: '#ffffff' }}>Criar Conta</CardTitle>
                    <CardDescription style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Preencha os dados para se cadastrar</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Nome</Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#ff9800' }} />
                      <Input id="signup-name" placeholder="Seu nome completo" value={name} onChange={(e) => setName(e.target.value)} className="pl-10 border-white/20 text-white placeholder:text-white/40 focus:border-[#ff9800] focus:ring-[#ff9800]" style={{ background: 'rgba(26, 34, 52, 0.8)' }} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#ff9800' }} />
                      <Input id="signup-email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 border-white/20 text-white placeholder:text-white/40 focus:border-[#ff9800] focus:ring-[#ff9800]" style={{ background: 'rgba(26, 34, 52, 0.8)' }} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#ff9800' }} />
                      <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 border-white/20 text-white placeholder:text-white/40 focus:border-[#ff9800] focus:ring-[#ff9800]" style={{ background: 'rgba(26, 34, 52, 0.8)' }} disabled={isLoading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-semibold text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #ff9800, #e08800)' }} disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando...</> : 'Criar Conta'}
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl" style={{ color: '#ffffff' }}>Login</CardTitle>
                <CardDescription style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Entre com suas credenciais para acessar o sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#ff9800' }} />
                      <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 border-white/20 text-white placeholder:text-white/40 focus:border-[#ff9800] focus:ring-[#ff9800]" style={{ background: 'rgba(26, 34, 52, 0.8)' }} disabled={isLoading} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Senha</Label>
                      <button type="button" onClick={() => setView('forgot')} className="text-xs hover:underline" style={{ color: '#ff9800' }}>Esqueceu a senha?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#ff9800' }} />
                      <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 border-white/20 text-white placeholder:text-white/40 focus:border-[#ff9800] focus:ring-[#ff9800]" style={{ background: 'rgba(26, 34, 52, 0.8)' }} disabled={isLoading} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-80" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full font-semibold text-white hover:opacity-90" style={{ background: 'linear-gradient(135deg, #ff9800, #e08800)' }} disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</> : 'Entrar'}
                  </Button>
                </form>
                <div className="mt-4 text-center">
                  <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Não tem conta? </span>
                  <button type="button" onClick={() => setView('signup')} className="text-sm hover:underline" style={{ color: '#ff9800' }}>Criar conta</button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="mt-4 text-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          © 2025 Use Sistemas. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
