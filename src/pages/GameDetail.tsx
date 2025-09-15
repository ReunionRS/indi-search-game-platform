// pages/GameDetail.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SimpleHeader from "@/components/SimpleHeader";
import GameDownload from "@/components/GameDownload";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Heart, Share, Flag, Calendar, Monitor, Gamepad2, ArrowLeft, ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { gamesService, GameData, GameBuild } from "@/lib/googleDrive";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const GameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  const [game, setGame] = useState<GameData | null>(null);
  const [builds, setBuilds] = useState<GameBuild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isPurchased, setIsPurchased] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      loadGameData();
    }
  }, [id, currentUser]);

  const loadGameData = async () => {
    if (!id) return;
    
    setLoading(true);
    setError("");

    try {
      // Загружаем данные игры
      const gameRef = doc(db, 'games', id);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        setError("Игра не найдена");
        return;
      }

      const gameData = { id: gameSnap.id, ...gameSnap.data() } as GameData;
      setGame(gameData);

      // Загружаем билды игры
      const buildsQuery = query(
        collection(db, 'builds'),
        where('gameId', '==', id)
      );
      const buildsSnap = await getDocs(buildsQuery);
      const buildsData: GameBuild[] = [];
      
      buildsSnap.forEach((doc) => {
        buildsData.push({ id: doc.id, ...doc.data() } as GameBuild);
      });
      setBuilds(buildsData);

      // Проверяем, куплена ли игра пользователем
      if (currentUser && !gameData.isFree) {
        await checkPurchaseStatus(id);
      } else if (gameData.isFree) {
        setIsPurchased(true);
      }

    } catch (err) {
      console.error("Error loading game:", err);
      setError("Ошибка загрузки игры");
    } finally {
      setLoading(false);
    }
  };

  const checkPurchaseStatus = async (gameId: string) => {
    if (!currentUser) return;

    try {
      const purchaseRef = doc(db, 'users', currentUser.uid, 'library', gameId);
      const purchaseSnap = await getDoc(purchaseRef);
      setIsPurchased(purchaseSnap.exists());
    } catch (err) {
      console.error("Error checking purchase status:", err);
    }
  };

  const handleDownload = async (buildId: string, platform: string) => {
    if (!game || !currentUser) return;

    setDownloading(true);
    try {
      // Увеличиваем счетчик загрузок
      const gameRef = doc(db, 'games', game.id!);
      await updateDoc(gameRef, {
        downloadCount: increment(1)
      });

      // Обновляем статистику в библиотеке пользователя
      if (isPurchased || game.isFree) {
        const libraryRef = doc(db, 'users', currentUser.uid, 'library', game.id!);
        const librarySnap = await getDoc(libraryRef);
        
        if (librarySnap.exists()) {
          await updateDoc(libraryRef, {
            downloadCount: increment(1),
            lastDownloaded: new Date()
          });
        } else if (game.isFree) {
          // Добавляем бесплатную игру в библиотеку при первом скачивании
          await updateDoc(libraryRef, {
            purchasedAt: new Date(),
            downloadCount: 1,
            lastDownloaded: new Date()
          });
        }
      }

      // Обновляем локальное состояние
      setGame(prev => prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : null);

    } catch (err) {
      console.error("Error updating download stats:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePurchase = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // TODO: Интеграция с платежной системой
    alert("Интеграция с платежной системой будет добавлена позже");
  };

  const handleLike = () => {
    // TODO: Система лайков
    alert("Система лайков будет добавлена позже");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Ссылка скопирована в буфер обмена");
  };

  const handleReport = () => {
    // TODO: Система жалоб
    alert("Система жалоб будет добавлена позже");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="aspect-video w-full" />
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-video" />
                ))}
              </div>
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-6">
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-between">
              {error || "Игра не найдена"}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate('/')}>
                  На главную
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Back Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>

            {/* Game Images */}
            <div className="mb-6">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                {game.coverImageUrl ? (
                  <img 
                    src={game.coverImageUrl} 
                    alt={game.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Gamepad2 className="h-16 w-16" />
                  </div>
                )}
              </div>
              
              {game.screenshots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {game.screenshots.map((screenshot, index) => (
                    <div key={index} className="aspect-video bg-muted rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                      <img 
                        src={screenshot} 
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Скриншоты не загружены
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{game.title}</h1>
                  <p className="text-xl text-muted-foreground mb-2">{game.developer}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{game.rating > 0 ? game.rating.toFixed(1) : "Нет оценок"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(game.createdAt?.toDate?.() || game.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <div className="text-muted-foreground">
                      {game.downloadCount} загрузок
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={handleLike}>
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleReport}>
                    <Flag className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="text-lg text-muted-foreground mb-4">{game.shortDescription}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary">{game.genre}</Badge>
                {game.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Platforms */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-sm font-medium">Платформы:</span>
                <div className="flex items-center gap-2">
                  {game.platforms.map((platform) => (
                    <div key={platform} className="flex items-center gap-1">
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm">{platform}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="description" className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="description">Описание</TabsTrigger>
                <TabsTrigger value="reviews">Отзывы</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-4">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-line text-foreground">
                    {game.fullDescription || "Подробное описание не добавлено"}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews" className="mt-4">
                <div className="text-center text-muted-foreground py-8">
                  Система отзывов будет добавлена в следующих обновлениях
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Download Component */}
              <GameDownload
                gameId={game.id!}
                gameTitle={game.title}
                builds={builds}
                price={game.price}
                isFree={game.isFree}
                isPurchased={isPurchased}
                onDownload={handleDownload}
                onPurchase={handlePurchase}
              />

              {/* Developer Info */}
              <div className="simple-card">
                <h3 className="font-semibold mb-3">О разработчике</h3>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <Gamepad2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-medium">{game.developer}</div>
                    <div className="text-sm text-muted-foreground">Разработчик</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Все игры разработчика
                </Button>
              </div>

              {/* Additional Info */}
              <div className="simple-card">
                <h3 className="font-semibold mb-3">Информация</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Жанр:</span>
                    <span className="ml-2 text-muted-foreground">{game.genre}</span>
                  </div>
                  <div>
                    <span className="font-medium">Дата выхода:</span>
                    <span className="ml-2 text-muted-foreground">
                      {new Date(game.createdAt?.toDate?.() || game.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Статус:</span>
                    <span className="ml-2">
                      <Badge variant={game.status === 'published' ? 'default' : 'secondary'}>
                        {game.status === 'published' ? 'Опубликовано' : 'Черновик'}
                      </Badge>
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Загрузок:</span>
                    <span className="ml-2 text-muted-foreground">{game.downloadCount}</span>
                  </div>
                </div>
              </div>

              {/* Help Links */}
              <div className="simple-card">
                <h3 className="font-semibold mb-3">Помощь</h3>
                <div className="space-y-2">
                  <Button variant="link" size="sm" className="p-0 h-auto justify-start">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Сообщить о проблеме
                  </Button>
                  <Button variant="link" size="sm" className="p-0 h-auto justify-start">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Руководство по установке
                  </Button>
                  <Button variant="link" size="sm" className="p-0 h-auto justify-start">
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Связаться с разработчиком
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetail;