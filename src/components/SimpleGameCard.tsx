import { useState } from "react";
import { Star, Download, ShoppingCart, Eye, Heart, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface SimpleGameCardProps {
  id: number;
  title: string;
  developer: string;
  price: string;
  rating: number;
  image: string;
  genre: string;
  platforms: string[];
  isFree?: boolean;
  shortDescription?: string;
}

const SimpleGameCard = ({ 
  id,
  title, 
  developer, 
  price, 
  rating, 
  image, 
  genre, 
  platforms, 
  isFree = false,
  shortDescription 
}: SimpleGameCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Проверяем, есть ли валидное изображение
  const hasValidImage = image && 
    image !== '/api/placeholder/300/400' && 
    !image.includes('placeholder') &&
    !imageError;

  // Создаем градиентный фон как альтернативу
  const generateGradient = (text: string) => {
    // Простой хеш для генерации цвета
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue1 = Math.abs(hash) % 360;
    const hue2 = (hue1 + 60) % 360;
    
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 40%))`;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <Link to={`/game/${id}`} className="game-card-simple block">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden">
        {hasValidImage ? (
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-transform hover:scale-105"
            onError={handleImageError}
            onLoad={handleImageLoad}
            style={{ display: imageError ? 'none' : 'block' }}
          />
        ) : null}
        
        {/* Fallback design */}
        {!hasValidImage && (
          <div 
            className="w-full h-full flex flex-col items-center justify-center text-white relative"
            style={{ background: generateGradient(title) }}
          >
            <Gamepad2 className="h-12 w-12 mb-2 opacity-80" />
            <div className="text-center px-2">
              <div className="font-bold text-sm line-clamp-2 mb-1">{title}</div>
              <div className="text-xs opacity-80">{genre}</div>
            </div>
            
            {/* Декоративные элементы */}
            <div className="absolute top-2 left-2 w-3 h-3 bg-white/20 rounded-full"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 bg-white/20 rounded-full"></div>
            <div className="absolute top-1/2 right-2 w-1 h-8 bg-white/10 rounded-full"></div>
          </div>
        )}

        <div className="absolute top-2 right-2">
          <Button variant="ghost" size="icon" className="w-8 h-8 bg-white/80 hover:bg-white">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        {isFree && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-green-500 text-white">Бесплатно</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="mb-2">
          <h3 className="font-medium text-foreground line-clamp-1 hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{developer}</p>
        </div>

        {shortDescription && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {shortDescription}
          </p>
        )}

        {/* Price and Rating */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">
              {rating > 0 ? rating.toFixed(1) : "—"}
            </span>
          </div>
          <div className="text-sm font-medium text-foreground">
            {price}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {genre}
          </Badge>
          {platforms.slice(0, 2).map((platform) => (
            <Badge key={platform} variant="outline" className="text-xs">
              {platform}
            </Badge>
          ))}
          {platforms.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{platforms.length - 2}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
};

export default SimpleGameCard;