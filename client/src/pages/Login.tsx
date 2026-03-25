import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic validation
    if (!loginUsername || !loginPassword) {
      setError('Username and password are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      toast({
        title: 'Login successful',
        description: 'Redirecting to dashboard...',
      });

      // Redirect to dashboard after successful login
      setLocation('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic validation
    if (!registerName || !registerEmail || !registerUsername || !registerPassword) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    // Simple email validation
    if (!registerEmail.includes('@')) {
      setError('Invalid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: registerName,
          email: registerEmail,
          username: registerUsername,
          password: registerPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }

      toast({
        title: 'Registration successful',
        description: 'Your account has been created. You can now log in.',
      });

      // Switch to login mode after successful registration
      setMode('login');
      setLoginUsername(registerUsername);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight gradient-text mb-2">
            IntuitionAI
          </h1>
          <p className="text-slate-400">Your Adaptive Learning Companion</p>
        </div>

        <Card className="glassmorphism-dark border-white/10 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">
              {mode === 'login' ? 'Welcome Back' : 'Get Started'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {mode === 'login'
                ? 'Sign in to continue your personalized journey'
                : 'Create an account to begin your adaptive learning'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {error && (
              <Alert variant="destructive" className="mb-6 bg-red-950/50 border-red-500/50 text-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-slate-300 ml-1">
                    Username
                  </label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    className="bg-slate-900/40 glassmorphism/5 border-white/10 text-white placeholder:text-slate-500 h-12 rounded-xl focus:ring-emerald-500/50"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-300 ml-1">
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-slate-900/40 glassmorphism/5 border-white/10 text-white placeholder:text-slate-500 h-12 rounded-xl focus:ring-emerald-500/50"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Authenticating...' : 'Sign In'}
                </Button>
                
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10"></span>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-slate-500">Or developer access</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 bg-slate-900/40 glassmorphism/5 border-white/10 text-white hover:bg-slate-900/40 glassmorphism/10 hover:border-white/20 rounded-xl transition-all"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const response = await fetch('/api/debug/login-test-user', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        }
                      });
                      if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.message || 'Login failed');
                      }
                      
                      toast({
                        title: 'Debug login successful',
                        description: 'Logged in as test user',
                      });
                      
                      setLocation('/');
                    } catch (err: any) {
                      setError(err.message);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                >
                  Access as Test User
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-300 ml-1">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    className="bg-slate-900/40 glassmorphism/5 border-white/10 text-white placeholder:text-slate-500 h-11 rounded-xl"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-300 ml-1">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    className="bg-slate-900/40 glassmorphism/5 border-white/10 text-white placeholder:text-slate-500 h-11 rounded-xl"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-username" className="text-sm font-medium text-slate-300 ml-1">
                    Username
                  </label>
                  <Input
                    id="register-username"
                    placeholder="johndoe"
                    className="bg-slate-900/40 glassmorphism/5 border-white/10 text-white placeholder:text-slate-500 h-11 rounded-xl"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-sm font-medium text-slate-300 ml-1">
                    Password
                  </label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    className="bg-slate-900/40 glassmorphism/5 border-white/10 text-white placeholder:text-slate-500 h-11 rounded-xl"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg mt-2 transition-all" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 bg-slate-900/40 glassmorphism/5 py-4">
            {mode === 'login' ? (
              <p className="text-slate-400 text-sm">
                New to IntuitionAI? {' '}
                <button onClick={() => setMode('register')} className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-4 hover:underline">
                  Create an account
                </button>
              </p>
            ) : (
              <p className="text-slate-400 text-sm">
                Already have an account? {' '}
                <button onClick={() => setMode('login')} className="text-blue-400 hover:text-blue-300 font-semibold underline-offset-4 hover:underline">
                  Sign in
                </button>
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}