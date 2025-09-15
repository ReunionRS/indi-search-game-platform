// pages/AddGame.tsx
import { useState } from "react";
import SimpleHeader from "@/components/SimpleHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  Plus, 
  Save, 
  Eye, 
  File, 
  CheckCircle, 
  AlertCircle,
  Download
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { gamesService, googleDriveService, GameBuild, GameData } from "@/lib/googleDrive";

interface FormData {
  title: string;
  shortDescription: string;
  fullDescription: string;
  genre: string;
  platforms: string[];
  stage: string;
  releaseDate: string;
  price: string;
  priceType: 'paid' | 'free' | 'pwyw' | 'demo';
  tags: string[];
  lookingForPublisher: boolean;
  visibility: 'public' | 'private' | 'companies-only';
}

interface UploadedFile {
  id: string;
  file: File;
  platform: string;
  uploadProgress: number;
  status: 'uploading' | 'completed' | 'error';
  driveFileId?: string;
  downloadUrl?: string;
}

const AddGame = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    shortDescription: "",
    fullDescription: "",
    genre: "",
    platforms: [],
    stage: "",
    releaseDate: "",
    price: "",
    priceType: "paid",
    tags: [],
    lookingForPublisher: false,
    visibility: "public"
  });

  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [gameFiles, setGameFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentTag, setCurrentTag] = useState("");

  const genres = [
    "Экшен", "Приключения", "RPG", "Стратегия", "Головоломка", 
    "Платформер", "Гонки", "Симулятор", "Хоррор", "Аркада"
  ];

  const platforms = [
    "Windows", "Mac", "Linux", "Android", "iOS", "Web", "PlayStation", "Xbox", "Nintendo Switch"
  ];

  const developmentStages = [
    { value: "idea", label: "Идея" },
    { value: "prototype", label: "Прототип" },
    { value: "alpha", label: "Альфа" },
    { value: "beta", label: "Бета" },
    { value: "release", label: "Релиз" }
  ];

  const handleFileUpload = async (files: FileList | null, platform: string) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Проверяем размер файла (максимум 500MB)
    if (file.size > 500 * 1024 * 1024) {
      setError("Размер файла не должен превышать 500MB");
      return;
    }

    // Проверяем тип файла
    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
      'application/x-msdownload'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.exe') && !file.name.endsWith('.apk')) {
      setError("Поддерживаются только файлы: ZIP, EXE, APK");
      return;
    }

    const uploadId = Date.now().toString();
    const newUpload: UploadedFile = {
      id: uploadId,
      file,
      platform,
      uploadProgress: 0,
      status: 'uploading'
    };

    setGameFiles(prev => [...prev, newUpload]);
    setError("");

    try {
      // Имитация процесса загрузки с прогрессом
      const interval = setInterval(() => {
        setGameFiles(prev => 
          prev.map(f => 
            f.id === uploadId 
              ? { ...f, uploadProgress: Math.min(f.uploadProgress + 10, 90) }
              : f
          )
        );
      }, 200);

      // Загружаем файл
      const fileId = await googleDriveService.uploadFile(file, 'temp-game-id', platform);
      const downloadUrl = await googleDriveService.getDownloadUrl(fileId);

      clearInterval(interval);

      setGameFiles(prev =>
        prev.map(f =>
          f.id === uploadId
            ? {
                ...f,
                uploadProgress: 100,
                status: 'completed',
                driveFileId: fileId,
                downloadUrl
              }
            : f
        )
      );
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      setGameFiles(prev =>
        prev.map(f =>
          f.id === uploadId
            ? { ...f, status: 'error', uploadProgress: 0 }
            : f
        )
      );
      setError("Ошибка загрузки файла");
    }
  };

  const removeFile = (fileId: string) => {
    setGameFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userProfile) {
      setError("Необходимо авторизоваться");
      return;
    }

    if (!formData.title || !formData.shortDescription || !formData.genre) {
      setError("Заполните все обязательные поля");
      return;
    }

    if (formData.platforms.length === 0) {
      setError("Выберите хотя бы одну платформу");
      return;
    }

    const completedFiles = gameFiles.filter(f => f.status === 'completed');
    if (completedFiles.length === 0) {
      setError("Загрузите хотя бы один файл игры");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Создаем игру
      const gameData: Omit<GameData, 'id'> = {
        title: formData.title,
        developer: userProfile.displayName || 'Unknown',
        developerId: userProfile.uid,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        genre: formData.genre,
        platforms: formData.platforms,
        price: formData.priceType === 'free' ? 0 : parseFloat(formData.price) || 0,
        isFree: formData.priceType === 'free',
        coverImageUrl: '', // TODO: загрузка обложки
        screenshots: [], // TODO: загрузка скриншотов
        tags: formData.tags,
        status: formData.visibility === 'public' ? 'published' : 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        rating: 0,
        downloadCount: 0,
        builds: []
      };

      const gameId = await gamesService.createGame(gameData);

      // Привязываем файлы к игре
      for (const file of completedFiles) {
        await gamesService.addBuildToGame(gameId, file.id);
      }

      navigate('/dashboard');
    } catch (submitError) {
      console.error('Submit error:', submitError);
      setError("Ошибка при публикации игры");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">Добавить игру</h1>
              <p className="text-muted-foreground">
                Поделитесь своим проектом с сообществом GameHub
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Превью
              </Button>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Сохранить черновик
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>
                Базовые данные о вашей игре
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Название игры *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Введите название игры"
                  className="mt-1"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="shortDescription">Краткое описание *</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({...formData, shortDescription: e.target.value})}
                  placeholder="Краткое описание для каталога (до 300 символов)"
                  className="mt-1"
                  rows={3}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.shortDescription.length}/300
                </p>
              </div>

              <div>
                <Label htmlFor="fullDescription">Полное описание *</Label>
                <Textarea
                  id="fullDescription"
                  value={formData.fullDescription}
                  onChange={(e) => setFormData({...formData, fullDescription: e.target.value})}
                  placeholder="Подробное описание игры (до 5000 символов)"
                  className="mt-1"
                  rows={8}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.fullDescription.length}/5000
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="genre">Жанр *</Label>
                  <Select onValueChange={(value) => setFormData({...formData, genre: value})} disabled={loading}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите жанр" />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre} value={genre}>
                          {genre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stage">Стадия разработки *</Label>
                  <Select onValueChange={(value) => setFormData({...formData, stage: value})} disabled={loading}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Выберите стадию" />
                    </SelectTrigger>
                    <SelectContent>
                      {developmentStages.map((stage) => (
                        <SelectItem key={stage.value} value={stage.value}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Платформы *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {platforms.map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform}
                        checked={formData.platforms.includes(platform)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              platforms: [...formData.platforms, platform]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              platforms: formData.platforms.filter(p => p !== platform)
                            });
                          }
                        }}
                        disabled={loading}
                      />
                      <Label htmlFor={platform} className="text-sm">
                        {platform}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <Label>Теги</Label>
                <div className="mt-2">
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Добавить тег"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      disabled={loading}
                    />
                    <Button type="button" onClick={addTag} size="sm" disabled={loading}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Game Files Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Файлы игры</CardTitle>
              <CardDescription>
                Загрузите исполняемые файлы для разных платформ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div className="space-y-4">
                {formData.platforms.map(platform => (
                  <div key={platform} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">{platform}</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.zip,.exe,.apk';
                          input.onchange = (e) => handleFileUpload((e.target as HTMLInputElement).files, platform);
                          input.click();
                        }}
                        disabled={loading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Загрузить файл
                      </Button>
                    </div>
                    
                    {/* Files for this platform */}
                    <div className="space-y-2">
                      {gameFiles
                        .filter(file => file.platform === platform)
                        .map(file => (
                          <div key={file.id} className="flex items-center gap-3 p-2 bg-muted rounded">
                            <File className="h-4 w-4" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{file.file.name}</span>
                                <div className="flex items-center gap-2">
                                  {file.status === 'completed' && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  )}
                                  {file.status === 'error' && (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(file.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(file.file.size / 1024 / 1024).toFixed(1)} MB
                              </div>
                              {file.status === 'uploading' && (
                                <Progress value={file.uploadProgress} className="mt-1" />
                              )}
                              {file.status === 'completed' && file.downloadUrl && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Download className="h-3 w-3" />
                                  <span className="text-xs text-green-600">Загружено успешно</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-muted-foreground">
                Поддерживаемые форматы: ZIP, EXE, APK. Максимальный размер: 500MB
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Цена и доступность</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Тип доступа *</Label>
                <Select 
                  onValueChange={(value) => setFormData({...formData, priceType: value as any})}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите тип доступа" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Бесплатная загрузка</SelectItem>
                    <SelectItem value="paid">Платная игра</SelectItem>
                    <SelectItem value="pwyw">Pay What You Want</SelectItem>
                    <SelectItem value="demo">Демо-версия</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.priceType === "paid" && (
                <div>
                  <Label htmlFor="price">Цена в рублях</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="999"
                    className="mt-1"
                    disabled={loading}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Настройки публикации</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lookingForPublisher"
                  checked={formData.lookingForPublisher}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, lookingForPublisher: checked as boolean})
                  }
                  disabled={loading}
                />
                <Label htmlFor="lookingForPublisher">
                  Ищу издателя/инвестора
                </Label>
              </div>

              <div>
                <Label>Видимость проекта</Label>
                <Select 
                  onValueChange={(value) => setFormData({...formData, visibility: value as any})}
                  disabled={loading}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите видимость" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Публичный</SelectItem>
                    <SelectItem value="private">Приватный</SelectItem>
                    <SelectItem value="companies-only">Только для компаний</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6">
            <Button variant="outline" asChild disabled={loading}>
              <Link to="/dashboard">Отмена</Link>
            </Button>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => setFormData({...formData, visibility: 'private'})}
                disabled={loading}
              >
                Сохранить черновик
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Публикация..." : "Опубликовать игру"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGame;