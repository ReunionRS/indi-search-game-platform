// components/GameFilters.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Filter, 
  Search, 
  X, 
  SlidersHorizontal,
  TrendingUp,
  Clock,
  Star,
  Gift
} from "lucide-react";

export interface GameFilters {
  search: string;
  genre: string;
  platform: string;
  priceMin: number;
  priceMax: number;
  isFree: boolean | null;
  rating: number;
  sortBy: 'newest' | 'popular' | 'rating' | 'price_low' | 'price_high';
  tags: string[];
}

interface GameFiltersProps {
  filters: GameFilters;
  onFiltersChange: (filters: GameFilters) => void;
  onApplyFilters: () => void;
  resultsCount?: number;
  isLoading?: boolean;
}

const GameFiltersComponent = ({ 
  filters, 
  onFiltersChange, 
  onApplyFilters,
  resultsCount = 0,
  isLoading = false
}: GameFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTag, setCurrentTag] = useState("");

  const genres = [
    "Все жанры",
    "Экшен", 
    "Приключения", 
    "RPG", 
    "Стратегия", 
    "Головоломка", 
    "Платформер", 
    "Гонки", 
    "Симулятор", 
    "Хоррор", 
    "Аркада",
    "Инди",
    "Казуальные"
  ];

  const platforms = [
    "Все платформы",
    "Windows", 
    "Mac", 
    "Linux", 
    "Android", 
    "iOS", 
    "Web", 
    "PlayStation", 
    "Xbox", 
    "Nintendo Switch"
  ];

  const popularTags = [
    "Фэнтези", "Научная фантастика", "Ретро", "Пиксель арт", 
    "Многопользовательская", "Одиночная игра", "Кооператив",
    "Открытый мир", "Процедурная генерация", "Выживание"
  ];

  const updateFilter = <K extends keyof GameFilters>(key: K, value: GameFilters[K]) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const addTag = (tag: string) => {
    if (tag && !filters.tags.includes(tag)) {
      updateFilter('tags', [...filters.tags, tag]);
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFilter('tags', filters.tags.filter(tag => tag !== tagToRemove));
  };

  const clearAllFilters = () => {
    onFiltersChange({
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
    onApplyFilters();
  };

  const hasActiveFilters = filters.search || filters.genre || filters.platform || 
                          filters.isFree !== null || filters.rating > 0 || 
                          filters.tags.length > 0 || filters.priceMin > 0 || 
                          filters.priceMax < 5000;

  return (
    <div className="space-y-4">
      {/* Quick Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Поиск игр, разработчиков, тегов..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onApplyFilters()}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Новые
                </div>
              </SelectItem>
              <SelectItem value="popular">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Популярные
                </div>
              </SelectItem>
              <SelectItem value="rating">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  По рейтингу
                </div>
              </SelectItem>
              <SelectItem value="price_low">Цена: по возрастанию</SelectItem>
              <SelectItem value="price_high">Цена: по убыванию</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фильтры
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                {[filters.genre, filters.platform, filters.isFree ? 'Бесплатные' : '', 
                  filters.rating > 0 ? `${filters.rating}+★` : '', ...filters.tags]
                  .filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {isLoading ? "Загрузка..." : `Найдено игр: ${resultsCount}`}
        </span>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-4 w-4 mr-1" />
            Очистить фильтры
          </Button>
        )}
      </div>

      {/* Quick Filter Tags */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.isFree === true ? "default" : "outline"}
          size="sm"
          onClick={() => updateFilter('isFree', filters.isFree === true ? null : true)}
        >
          <Gift className="h-4 w-4 mr-1" />
          Бесплатные
        </Button>
        
        {popularTags.slice(0, 4).map(tag => (
          <Button
            key={tag}
            variant={filters.tags.includes(tag) ? "default" : "outline"}
            size="sm"
            onClick={() => {
              if (filters.tags.includes(tag)) {
                removeTag(tag);
              } else {
                addTag(tag);
              }
              onApplyFilters();
            }}
          >
            {tag}
          </Button>
        ))}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Расширенные фильтры
            </CardTitle>
            <CardDescription>
              Настройте параметры поиска для точного результата
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Genre and Platform */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Жанр</Label>
                <Select value={filters.genre} onValueChange={(value) => updateFilter('genre', value === "Все жанры" ? "" : value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите жанр" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map(genre => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Платформа</Label>
                <Select value={filters.platform} onValueChange={(value) => updateFilter('platform', value === "Все платформы" ? "" : value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Выберите платформу" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Range */}
            <div>
              <Label>Диапазон цен (₽)</Label>
              <div className="mt-2 space-y-2">
                <Slider
                  value={[filters.priceMin, filters.priceMax]}
                  onValueChange={([min, max]) => {
                    updateFilter('priceMin', min);
                    updateFilter('priceMax', max);
                  }}
                  min={0}
                  max={5000}
                  step={50}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{filters.priceMin} ₽</span>
                  <span>{filters.priceMax >= 5000 ? "5000+ ₽" : `${filters.priceMax} ₽`}</span>
                </div>
              </div>
            </div>

            {/* Rating */}
            <div>
              <Label>Минимальный рейтинг</Label>
              <div className="mt-2">
                <Slider
                  value={[filters.rating]}
                  onValueChange={([rating]) => updateFilter('rating', rating)}
                  min={0}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                  <span>Любой</span>
                  <span>{filters.rating > 0 ? `${filters.rating}+ ★` : "Любой"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tags */}
            <div>
              <Label>Теги</Label>
              <div className="mt-2 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Добавить тег..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(currentTag))}
                  />
                  <Button 
                    type="button" 
                    onClick={() => addTag(currentTag)}
                    disabled={!currentTag.trim()}
                  >
                    Добавить
                  </Button>
                </div>

                {/* Popular Tags */}
                <div>
                  <div className="text-sm font-medium mb-2">Популярные теги:</div>
                  <div className="flex flex-wrap gap-1">
                    {popularTags.map(tag => (
                      <Button
                        key={tag}
                        variant={filters.tags.includes(tag) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (filters.tags.includes(tag)) {
                            removeTag(tag);
                          } else {
                            addTag(tag);
                          }
                        }}
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Selected Tags */}
                {filters.tags.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Выбранные теги:</div>
                    <div className="flex flex-wrap gap-1">
                      {filters.tags.map(tag => (
                        <Badge key={tag} variant="default" className="flex items-center gap-1">
                          {tag}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => removeTag(tag)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={onApplyFilters} className="flex-1">
                Применить фильтры
              </Button>
              <Button variant="outline" onClick={clearAllFilters}>
                Очистить все
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GameFiltersComponent;