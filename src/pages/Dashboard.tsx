// pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import SimpleHeader from "@/components/SimpleHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Library, Plus, User, Settings, Download, Eye, Edit, Trash2 } from "lucide-react";
import SimpleGameCard from "@/components/SimpleGameCard";
import { useAuth } from "@/contexts/AuthContext";
import { GameData } from "@/lib/googleDrive";
import { collection, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Dashboard = () => {
  const location = useLocation();
  const { currentUser, userProfile } = useAuth();
  
  const [userGames, setUserGames] = useState<GameData[]>([]);
  const [libraryGames, setLibraryGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError("");

    try {
      // Загружаем игры пользователя
      const userGamesQuery = query(
        collection(db, 'games'),
        where('developerId', '==', currentUser.uid)
      );
      const userGamesSnap = await getDocs(userGamesQuery);
      const userGamesData: GameData[] = [];
      
      userGamesSnap.forEach((doc) => {
        userGamesData.push({ id: doc.id, ...doc.data() } as GameData);
      });
      setUserGames(userGamesData);

      // Загружаем библиотеку пользователя
      const libraryQuery = query(
        collection(db, 'users', currentUser.uid, 'library')
      );
      const librarySnap = await getDocs(libraryQuery);
      const libraryGameIds: string[] = [];
      
      librarySnap.forEach((doc) => {
        libraryGameIds.push(doc.id);
      });

      // Загружаем данные игр из библиотеки
      if (libraryGameIds.length > 0) {
        const libraryGamesData: GameData[] = [];
        for (const gameId of libraryGameIds) {
          const gameDoc = await getDocs(query(
            collection(db, 'games'),
            where('__name__', '==', gameId)
          ));
          gameDoc.forEach((doc) => {
            libraryGamesData.push({ id: doc.id, ...doc.data() } as GameData);
          });
        }
        setLibraryGames(libraryGamesData);
      }

    } catch (err) {
      console.error("Error loading user data:", err);
      setError("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту игру?")) return;

    try {
      await deleteDoc(doc(db, 'games', gameId));
      setUserGames(prev => prev.filter(game => game.id !== gameId));
      alert("Игра успешно удалена");
    } catch (err) {
      console.error("Error deleting game:", err);
      alert("Ошибка при удалении игры");
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <SimpleHeader />
        <div className="container mx-auto px-4 py-6">
          <Alert>
            <AlertDescription>
              Загрузка профиля пользователя...
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
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64">
            <div className="simple-card">
              {/* User Profile */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-medium">{userProfile.displayName || 'Пользователь'}</div>
                  <div className="text-sm text-muted-foreground">
                    {userProfile.userType === 'developer' ? 'Разработчик' : 'Компания'} с {new Date(userProfile.createdAt?.toDate?.() || userProfile.createdAt).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Navigation Menu */}
              <nav className="space-y-1">
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    location.pathname === "/dashboard" 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Library className="h-4 w-4" />
                  Библиотека
                </Link>
                <Link
                  to="/dashboard/profile"
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    location.pathname === "/dashboard/profile"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <User className="h-4 w-4" />
                  Профиль
                </Link>
                <Link
                  to="/dashboard/settings"
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    location.pathname === "/dashboard/settings"
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Настройки
                </Link>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="library" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="library">Библиотека ({libraryGames.length})</TabsTrigger>
                  <TabsTrigger value="projects">Мои проекты ({userGames.length})</TabsTrigger>
                </TabsList>
                <Button asChild>
                  <Link to="/dashboard/add-game">
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить игру
                  </Link>
                </Button>
              </div>

              <TabsContent value="library" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Моя библиотека</h2>
                  <p className="text-muted-foreground mb-6">
                    Игры, которые вы купили или скачали бесплатно
                  </p>
                  
                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="space-y-3">
                          <Skeleton className="aspect-[3/4] w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : libraryGames.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {libraryGames.map((game) => (
                        <div key={game.id} className="relative">
                          <SimpleGameCard 
                            id={parseInt(game.id || "0")}
                            title={game.title}
                            developer={game.developer}
                            price={game.isFree ? "Бесплатно" : `${game.price} ₽`}
                            rating={game.rating}
                            image={game.coverImageUrl || '/api/placeholder/300/400'}
                            genre={game.genre}
                            platforms={game.platforms}
                            isFree={game.isFree}
                            shortDescription={game.shortDescription}
                          />
                          <div className="absolute top-2 right-2 z-10">
                            <Button size="sm" variant="secondary" asChild>
                              <Link to={`/game/${game.id}`}>
                                <Download className="h-4 w-4 mr-1" />
                                Играть
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Ваша библиотека пуста</h3>
                      <p className="text-muted-foreground mb-4">
                        Начните собирать коллекцию игр от независимых разработчиков
                      </p>
                      <Button asChild>
                        <Link to="/">Найти игры</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="projects" className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-4">Мои проекты</h2>
                  <p className="text-muted-foreground mb-6">
                    Игры, которые вы опубликовали на платформе
                  </p>
                  
                  {loading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="simple-card">
                          <div className="flex gap-4">
                            <Skeleton className="w-24 h-24" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-6 w-1/2" />
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-1/4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : userGames.length > 0 ? (
                    <div className="space-y-4">
                      {userGames.map((project) => (
                        <div key={project.id} className="simple-card">
                          <div className="flex gap-4">
                            <div className="w-24 h-24 bg-muted rounded overflow-hidden flex-shrink-0">
                              {project.coverImageUrl ? (
                                <img 
                                  src={project.coverImageUrl} 
                                  alt={project.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Library className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-medium text-lg">{project.title}</h3>
                                  <p className="text-muted-foreground">{project.shortDescription}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <span>
                                      Статус: <span className={project.status === 'published' ? 'text-green-600' : 'text-orange-600'}>
                                        {project.status === 'published' ? 'Опубликовано' : 'Черновик'}
                                      </span>
                                    </span>
                                    <span>Цена: {project.isFree ? 'Бесплатно' : `${project.price} ₽`}</span>
                                    <span>Рейтинг: {project.rating > 0 ? project.rating.toFixed(1) : 'Нет оценок'}</span>
                                    <span>Загрузок: {project.downloadCount}</span>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" asChild>
                                    <Link to={`/game/${project.id}`}>
                                      <Eye className="h-4 w-4 mr-1" />
                                      Посмотреть
                                    </Link>
                                  </Button>
                                  <Button variant="outline" size="sm" asChild>
                                    <Link to={`/dashboard/edit-game/${project.id}`}>
                                      <Edit className="h-4 w-4 mr-1" />
                                      Редактировать
                                    </Link>
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleDeleteGame(project.id!)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Удалить
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">У вас нет опубликованных проектов</h3>
                      <p className="text-muted-foreground mb-4">
                        Поделитесь своими играми с сообществом GameHub
                      </p>
                      <Button asChild>
                        <Link to="/dashboard/add-game">
                          <Plus className="h-4 w-4 mr-2" />
                          Добавить игру
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;