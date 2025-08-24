import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Image as ImageIcon, Mail, Lock, User } from 'lucide-react';
import { useState } from 'react';
import type { RegisterUserInput, LoginUserInput, AuthResponse } from '../../../server/src/schema';

interface AuthFormProps {
  onAuthSuccess: (response: AuthResponse) => void;
  onAuthAction: (action: () => Promise<AuthResponse>) => Promise<void>;
  error: string | null;
  success: string | null;
  isLoading: boolean;
}

export function AuthForm({ onAuthSuccess, onAuthAction, error, success, isLoading }: AuthFormProps) {
  const [authForm, setAuthForm] = useState<RegisterUserInput>({
    email: '',
    password: '',
    username: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onAuthAction(async () => {
      const { trpc } = await import('@/utils/trpc');
      const response = await trpc.registerUser.mutate(authForm);
      
      // Reset form on success
      setAuthForm({ email: '', password: '', username: '' });
      
      return response;
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onAuthAction(async () => {
      const { trpc } = await import('@/utils/trpc');
      const loginData: LoginUserInput = {
        email: authForm.email,
        password: authForm.password
      };
      
      const response = await trpc.loginUser.mutate(loginData);
      
      // Reset form on success
      setAuthForm({ email: '', password: '', username: '' });
      
      return response;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-blue-600 p-3 rounded-full">
                <ImageIcon className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">ImageVault</h1>
            <p className="text-gray-600 text-lg">Your personal image collection</p>
            <p className="text-sm text-gray-500 mt-2">
              ✨ Secure • Simple • Beautiful
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 slide-in">
              <AlertDescription className="text-red-800 flex items-center">
                <span className="mr-2">❌</span>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50 slide-in">
              <AlertDescription className="text-green-800 flex items-center">
                <span className="mr-2">✅</span>
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Auth Card */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login" className="text-sm">Sign In</TabsTrigger>
                  <TabsTrigger value="register" className="text-sm">Create Account</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-6">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={authForm.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAuthForm((prev: RegisterUserInput) => ({ ...prev, email: e.target.value }))
                        }
                        required
                        className="h-12"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                        <Lock className="h-4 w-4" />
                        <span>Password</span>
                      </label>
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        value={authForm.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAuthForm((prev: RegisterUserInput) => ({ ...prev, password: e.target.value }))
                        }
                        required
                        className="h-12"
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full h-12 text-base font-medium"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="loading-spinner"></div>
                          <span>Signing In...</span>
                        </div>
                      ) : (
                        '🔑 Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register" className="space-y-6">
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>Username</span>
                      </label>
                      <Input
                        placeholder="Choose a username"
                        value={authForm.username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAuthForm((prev: RegisterUserInput) => ({ ...prev, username: e.target.value }))
                        }
                        required
                        minLength={3}
                        maxLength={50}
                        className="h-12"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={authForm.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAuthForm((prev: RegisterUserInput) => ({ ...prev, email: e.target.value }))
                        }
                        required
                        className="h-12"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center space-x-1">
                        <Lock className="h-4 w-4" />
                        <span>Password</span>
                      </label>
                      <Input
                        type="password"
                        placeholder="Create a secure password"
                        value={authForm.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setAuthForm((prev: RegisterUserInput) => ({ ...prev, password: e.target.value }))
                        }
                        required
                        minLength={8}
                        className="h-12"
                      />
                      <p className="text-xs text-gray-500">
                        At least 8 characters long
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isLoading} 
                      className="w-full h-12 text-base font-medium"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="loading-spinner"></div>
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        '🎉 Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center mt-8 space-y-2">
            <p className="text-sm text-gray-500">
              📝 This is a demo with placeholder backend functionality
            </p>
            <p className="text-xs text-gray-400">
              Made with ❤️ using React, TypeScript, and Tailwind CSS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}