// pages/Index.tsx
import { useState, useEffect } from "react";
import SimpleHeader from "@/components/SimpleHeader";
import SimpleGameCard from "@/components/SimpleGameCard";
import GameFiltersComponent, { GameFilters } from "@/components/GameFilters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, Users, TrendingUp, Clock, Gift, RefreshCw, Plus } from "lucide-react";
import { gamesService, GameData } from "@/lib/googleDrive";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { currentUser } = useAuth();
  const [games, setGames] = useState<GameData[]>([]);
  const [filteredGames, setFilteredGames] = useState<GameData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [filters, setFilters] = useState<GameFilters>({
    search: "",
    genre: "",
    platform: "",
    priceMin: 0,
    priceMax: 5000,
    isFree: null,
    rating: 0,
    sortBy: 'newest',
    tags: []
  });

  // Загрузка игр при изменении фильтров или вкладки
  useEffect(() => {
    loadGames(true);
  }, [activeTab]);

  const loadGames = async (reset = false) => {
    setLoading(true);
    setError("");

    try {
      let sortBy: 'newest' | 'popular' | 'rating' = 'newest';
      let isFreeFilter: boolean | undefined = undefined;

      // Настройка фильтров в зависимости от активной вкладки
      switch (activeTab) {
        case "trending":
          sortBy = 'popular';
          break;
        case "new":
          sortBy = 'newest';
          break;
        case "free":
          isFreeFilter = true;
          break;
        case "top":
          sortBy = 'rating';
          break;
      }

      const { games: newGames, lastDoc: newLastDoc } = await gamesService.getGames({
        ...filters,
        sortBy,
        isFree: isFreeFilter,
        lastDoc: reset ? null : lastDoc,
        limitCount: 12
      });

      if (reset) {
        setGames(newGames);
        setFilteredGames(newGames);
        setLastDoc(newLastDoc);
      } else {
        setGames(prev => [...prev, ...newGames]);
        setFilteredGames(prev => [...prev, ...newGames]);
        setLastDoc(newLastDoc);
      }

      setHasMore(newGames.length === 12);
    } catch (err) {
      console.error("Error loading games:", err);
      setError("Ошибка загрузки игр");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const { games: filteredGames } = await gamesService.getGames({
        ...filters,
        limitCount: 20
      });
      setFilteredGames(filteredGames);
    } catch (err) {
      setError("Ошибка применения фильтров");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadGames(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />
      
      <main>
        {/* Hero Section */}
        <section className="bg-muted/30 py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Откройте мир{" "}
              <span className="text-primary">независимых игр</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Платформа для публикации, покупки и открытия уникальных игр от талантливых разработчиков
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => document.getElementById('games-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <Star className="h-4 w-4 mr-2" />
                Исследовать игры
              </Button>
              {currentUser ? (
                <Button variant="outline" size="lg" asChild>
                  <Link to="/dashboard/add-game">
                    <Plus className="h-4 w-4 mr-2" />
                    Опубликовать игру
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="lg" asChild>
                  <Link to="/register">
                    <Users className="h-4 w-4 mr-2" />
                    Для разработчиков
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Games Section */}
        <section id="games-section" className="py-16">
          <div className="container mx-auto px-4">
            {/* Section Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold mb-2">
                  Каталог игр
                </h2>
                <p className="text-muted-foreground text-lg">
                  Самые интересные проекты от сообщества разработчиков
                </p>
              </div>
              {currentUser && (
                <Button asChild>
                  <Link to="/dashboard/add-game">
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить игру
                  </Link>
                </Button>
              )}
            </div>

            {/* Filters */}
            <div className="mb-8">
              <GameFiltersComponent
                filters={filters}
                onFiltersChange={setFilters}
                onApplyFilters={applyFilters}
                resultsCount={filteredGames.length}
                isLoading={loading}
              />
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription className="flex items-center justify-between">
                  {error}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => loadGames(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Повторить
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
              <TabsList className="grid w-full max-w-lg grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Все
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Популярные
                </TabsTrigger>
                <TabsTrigger value="new" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Новые
                </TabsTrigger>
                <TabsTrigger value="free" className="flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  Бесплатные
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-8">
                {loading && filteredGames.length === 0 ? (
                  // Loading skeletons
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, index) => (
                      <div key={index} className="space-y-3">
                        <Skeleton className="aspect-[3/4] w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredGames.length > 0 ? (
                  <>
                    {/* Games Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredGames.map((game) => (
                        <SimpleGameCard 
                          key={game.id} 
                          id={parseInt(game.id || "0")}
                          title={game.title}
                          developer={game.developer}
                          price={game.isFree ? "Бесплатно" : `${game.price} ₽`}
                          rating={game.rating}
                          image={game.coverImageUrl || '/api/placeholder/300/400'} // Fallback изображение
                          genre={game.genre}
                          platforms={game.platforms}
                          isFree={game.isFree}
                          shortDescription={game.shortDescription}
                        />
                      ))}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="text-center mt-12">
                        <Button 
                          variant="outline" 
                          size="lg" 
                          onClick={loadMore}
                          disabled={loading}
                          className="min-w-48"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Загрузка...
                            </>
                          ) : (
                            "Показать ещё"
                          )}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  // No results
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎮</div>
                    <h3 className="text-xl font-semibold mb-2">
                      {games.length === 0 ? "Игры ещё не добавлены" : "Игры не найдены"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {games.length === 0 
                        ? "Станьте первым, кто опубликует игру на платформе!"
                        : "Попробуйте изменить параметры поиска или очистить фильтры"
                      }
                    </p>
                    {games.length === 0 ? (
                      currentUser ? (
                        <Button asChild>
                          <Link to="/dashboard/add-game">
                            <Plus className="h-4 w-4 mr-2" />
                            Добавить первую игру
                          </Link>
                        </Button>
                      ) : (
                        <Button asChild>
                          <Link to="/register">
                            Зарегистрироваться как разработчик
                          </Link>
                        </Button>
                      )
                    ) : (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setFilters({
                            search: "",
                            genre: "",
                            platform: "",
                            priceMin: 0,
                            priceMax: 5000,
                            isFree: null,
                            rating: 0,
                            sortBy: 'newest',
                            tags: []
                          });
                          applyFilters();
                        }}
                      >
                        Очистить фильтры
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Статистика платформы</h2>
              <p className="text-muted-foreground">
                Растущее сообщество независимых разработчиков
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">{games.length}</div>
                <div className="text-muted-foreground">Опубликованных игр</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  {games.reduce((sum, game) => sum + game.downloadCount, 0)}
                </div>
                <div className="text-muted-foreground">Общих загрузок</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  {games.filter(game => game.isFree).length}
                </div>
                <div className="text-muted-foreground">Бесплатных игр</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Simple Footer */}
      <footer className="border-t py-8 bg-card">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2024 GameHub Russia. Платформа для независимых разработчиков игр.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;