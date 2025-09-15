// pages/Profile.tsx
import { useState, useEffect } from "react";
import SimpleHeader from "@/components/SimpleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Calendar, 
  Building, 
  Save,
  Upload,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

interface ProfileForm {
  displayName: string;
  bio: string;
  website: string;
  location: string;
  skills: string;
  // Company fields
  companyName: string;
  companyWebsite: string;
}

const Profile = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    displayName: '',
    bio: '',
    website: '',
    location: '',
    skills: '',
    companyName: '',
    companyWebsite: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (userProfile) {
      setForm({
        displayName: userProfile.displayName || '',
        bio: userProfile.bio || '',
        website: userProfile.website || '',
        location: userProfile.location || '',
        skills: userProfile.skills?.join(', ') || '',
        companyName: userProfile.companyName || '',
        companyWebsite: userProfile.companyWebsite || ''
      });
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const updateData: any = {
        displayName: form.displayName,
        bio: form.bio,
        website: form.website,
        location: form.location,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(s => s) : []
      };

      if (userProfile?.userType === 'company') {
        updateData.companyName = form.companyName;
        updateData.companyWebsite = form.companyWebsite;
      }

      await updateUserProfile(updateData);
      setMessage({ type: 'success', text: 'Профиль успешно обновлен!' });
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      setMessage({ type: 'error', text: 'Произошла ошибка при обновлении профиля' });
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof ProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (!userProfile) {
    return <div>Загрузка...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info Card */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={userProfile.photoURL || ''} />
                      <AvatarFallback className="text-2xl">
                        {userProfile.displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="flex items-center gap-2 justify-center">
                    {userProfile.displayName || 'Пользователь'}
                    {userProfile.userType === 'company' && userProfile.verified && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant={userProfile.userType === 'developer' ? 'default' : 'secondary'}>
                      {userProfile.userType === 'developer' ? 'Разработчик' : 'Компания'}
                    </Badge>
                    {userProfile.userType === 'company' && !userProfile.verified && (
                      <Badge variant="outline" className="ml-2 text-orange-500 border-orange-500">
                        Не подтверждено
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {userProfile.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Участник с {new Date(userProfile.createdAt?.toDate()).toLocaleDateString('ru-RU', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>
                  {userProfile.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {userProfile.location}
                    </div>
                  )}
                  {userProfile.website && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-4 w-4" />
                      <a href={userProfile.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        {userProfile.website}
                      </a>
                    </div>
                  )}
                  
                  {userProfile.bio && (
                    <div className="pt-2">
                      <p className="text-sm">{userProfile.bio}</p>
                    </div>
                  )}

                  {userProfile.skills && userProfile.skills.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm font-medium mb-2">Навыки:</p>
                      <div className="flex flex-wrap gap-1">
                        {userProfile.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-4">
                    <Upload className="h-4 w-4 mr-2" />
                    Изменить фото
                  </Button>
                </CardContent>
              </Card>

              {/* Company Verification Card */}
              {userProfile.userType === 'company' && !userProfile.verified && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      Верификация компании
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Подтвердите статус компании для получения расширенных возможностей
                    </p>
                    <Button size="sm" className="w-full">
                      Подать заявку
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Edit Profile Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Редактировать профиль</CardTitle>
                  <CardDescription>
                    Обновите информацию о себе
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {message && (
                    <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                      <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="displayName">
                        {userProfile.userType === 'company' ? 'Контактное лицо' : 'Имя'} *
                      </Label>
                      <Input
                        id="displayName"
                        value={form.displayName}
                        onChange={(e) => updateForm('displayName', e.target.value)}
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="location">Местоположение</Label>
                      <Input
                        id="location"
                        value={form.location}
                        onChange={(e) => updateForm('location', e.target.value)}
                        placeholder="Москва, Россия"
                        disabled={loading}
                      />
                    </div>

                    <div>
                      <Label htmlFor="website">
                        {userProfile.userType === 'company' ? 'Сайт компании' : 'Личный сайт'}
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={userProfile.userType === 'company' ? form.companyWebsite : form.website}
                        onChange={(e) => updateForm(
                          userProfile.userType === 'company' ? 'companyWebsite' : 'website', 
                          e.target.value
                        )}
                        placeholder="https://example.com"
                        disabled={loading}
                      />
                    </div>

                    {userProfile.userType === 'developer' && (
                      <div>
                        <Label htmlFor="skills">Навыки и технологии</Label>
                        <Input
                          id="skills"
                          value={form.skills}
                          onChange={(e) => updateForm('skills', e.target.value)}
                          placeholder="Unity, C#, JavaScript, React (через запятую)"
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Перечислите навыки через запятую
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Сохранение...' : 'Сохранить изменения'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          // Reset form to original values
                          setForm({
                            displayName: userProfile.displayName || '',
                            bio: userProfile.bio || '',
                            website: userProfile.website || '',
                            location: userProfile.location || '',
                            skills: userProfile.skills?.join(', ') || '',
                            companyName: userProfile.companyName || '',
                            companyWebsite: userProfile.companyWebsite || ''
                          });
                          setMessage(null);
                        }}
                        disabled={loading}
                      >
                        Отменить
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Statistics Card */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Статистика</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">
                        {userProfile.userType === 'company' ? 'Проекты' : 'Игры'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Подписчики</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Скачиваний</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">0</div>
                      <div className="text-sm text-muted-foreground">Отзывы</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Profile;