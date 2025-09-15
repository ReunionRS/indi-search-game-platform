// pages/Register.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Lock, User, ArrowLeft, Building } from "lucide-react";
import { useAuth, UserType } from "@/contexts/AuthContext";
import { PublicRoute } from "@/components/ProtectedRoute";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  // Company specific fields
  companyName?: string;
  contactPerson?: string;
  // Terms acceptance
  acceptTerms: boolean;
}

const Register = () => {
  const [userType, setUserType] = useState<UserType>('developer');
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    acceptTerms: false
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { signup, loginWithGoogle, loginWithGithub } = useAuth();
  const navigate = useNavigate();

  function validateForm(): string {
    if (!formData.email || !formData.password || !formData.displayName) {
      return "Заполните все обязательные поля";
    }

    if (formData.password.length < 6) {
      return "Пароль должен содержать минимум 6 символов";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Пароли не совпадают";
    }

    if (userType === 'company' && !formData.companyName) {
      return "Укажите название компании";
    }

    if (!formData.acceptTerms) {
      return "Необходимо согласиться с условиями использования";
    }

    return "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      return setError(validationError);
    }

    try {
      setError("");
      setLoading(true);

      const additionalData: any = {
        displayName: formData.displayName,
      };

      if (userType === 'company') {
        additionalData.companyName = formData.companyName;
        additionalData.contactPerson = formData.contactPerson || formData.displayName;
        additionalData.verified = false; // Companies need verification
      }

      await signup(formData.email, formData.password, userType, additionalData);
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Ошибка регистрации:", error);
      
      if (error.code === 'auth/email-already-in-use') {
        setError("Пользователь с таким email уже существует");
      } else if (error.code === 'auth/weak-password') {
        setError("Пароль слишком простой");
      } else {
        setError("Произошла ошибка при регистрации");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialSignup(provider: 'google' | 'github') {
    try {
      setError("");
      setLoading(true);
      
      if (provider === 'google') {
        await loginWithGoogle(userType);
      } else {
        await loginWithGithub(userType);
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error(`Ошибка регистрации через ${provider}:`, error);
      setError(`Не удалось зарегистрироваться через ${provider === 'google' ? 'Google' : 'GitHub'}`);
    } finally {
      setLoading(false);
    }
  }

  function updateFormData(field: keyof FormData, value: string | boolean) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  return (
    <PublicRoute>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" />
              Вернуться на главную
            </Link>
            <Link to="/" className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-sm">GH</span>
              </div>
              <span className="font-bold text-xl text-foreground">GameHub</span>
            </Link>
          </div>

          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Регистрация</CardTitle>
              <CardDescription>
                Создайте аккаунт, чтобы публиковать игры и собирать коллекцию
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs value={userType} onValueChange={(value) => setUserType(value as UserType)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="developer" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Разработчик
                  </TabsTrigger>
                  <TabsTrigger value="company" className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Компания
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="developer" className="space-y-4 mt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="developer-name">Имя пользователя *</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="developer-name"
                          type="text"
                          placeholder="Ваше имя"
                          className="pl-10"
                          value={formData.displayName}
                          onChange={(e) => updateFormData('displayName', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="developer-email">Email *</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="developer-email"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="developer-password">Пароль *</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="developer-confirm-password"
                          type="password"
                          placeholder="Повторите пароль"
                          className="pl-10"
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        className="mt-0.5 rounded" 
                        checked={formData.acceptTerms}
                        onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
                        disabled={loading}
                      />
                      <span className="text-muted-foreground">
                        Я согласен с{" "}
                        <Link to="/terms" className="text-primary hover:underline">
                          условиями использования
                        </Link>{" "}
                        и{" "}
                        <Link to="/privacy" className="text-primary hover:underline">
                          политикой конфиденциальности
                        </Link>
                      </span>
                    </div>

                    <Button className="w-full" size="lg" type="submit" disabled={loading}>
                      {loading ? "Создание аккаунта..." : "Создать аккаунт"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="company" className="space-y-4 mt-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="company-name">Название компании *</Label>
                      <div className="relative mt-1">
                        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="company-name"
                          type="text"
                          placeholder="ООО Игровая студия"
                          className="pl-10"
                          value={formData.companyName || ''}
                          onChange={(e) => updateFormData('companyName', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="contact-person">Контактное лицо *</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="contact-person"
                          type="text"
                          placeholder="Иван Иванов"
                          className="pl-10"
                          value={formData.displayName}
                          onChange={(e) => updateFormData('displayName', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="company-email">Корпоративный email *</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="company-email"
                          type="email"
                          placeholder="contact@company.com"
                          className="pl-10"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="company-password">Пароль *</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="company-password"
                          type="password"
                          placeholder="Минимум 6 символов"
                          className="pl-10"
                          value={formData.password}
                          onChange={(e) => updateFormData('password', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="company-confirm-password">Подтвердите пароль *</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                          id="company-confirm-password"
                          type="password"
                          placeholder="Повторите пароль"
                          className="pl-10"
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                      <strong>Внимание:</strong> Аккаунт компании требует проверки. 
                      После регистрации вам потребуется подтвердить документы для получения доступа к расширенным функциям.
                    </div>

                    <div className="flex items-start gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        className="mt-0.5 rounded"
                        checked={formData.acceptTerms}
                        onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
                        disabled={loading}
                      />
                      <span className="text-muted-foreground">
                        Я согласен с{" "}
                        <Link to="/terms" className="text-primary hover:underline">
                          условиями использования
                        </Link>{" "}
                        и{" "}
                        <Link to="/privacy" className="text-primary hover:underline">
                          политикой конфиденциальности
                        </Link>
                      </span>
                    </div>

                    <Button className="w-full" size="lg" type="submit" disabled={loading}>
                      {loading ? "Регистрация компании..." : "Зарегистрировать компанию"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <Separator className="my-6" />

              {/* Social Register */}
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleSocialSignup('google')}
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Регистрация через Google
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleSocialSignup('github')}
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Регистрация через GitHub
                </Button>
              </div>
            </CardContent>
            <CardFooter className="text-center">
              <div className="text-sm text-muted-foreground">
                Уже есть аккаунт?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Войти
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PublicRoute>
  );
};

export default Register