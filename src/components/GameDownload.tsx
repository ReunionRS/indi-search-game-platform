// components/GameDownload.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  ExternalLink, 
  Shield, 
  FileArchive, 
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { GameBuild } from "@/lib/googleDrive";

interface GameDownloadProps {
  gameId: string;
  gameTitle: string;
  builds: GameBuild[];
  price: number;
  isFree: boolean;
  isPurchased?: boolean;
  onDownload: (buildId: string, platform: string) => void;
  onPurchase?: () => void;
}

const GameDownload = ({ 
  gameId, 
  gameTitle, 
  builds, 
  price, 
  isFree, 
  isPurchased = false,
  onDownload,
  onPurchase 
}: GameDownloadProps) => {
  const [downloadingBuild, setDownloadingBuild] = useState<string | null>(null);

  const handleDownload = async (build: GameBuild) => {
    if (!isPurchased && !isFree) {
      onPurchase?.();
      return;
    }

    setDownloadingBuild(build.id!);
    
    try {
      // Имитация процесса скачивания
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // В реальном приложении здесь будет генерация безопасной ссылки для скачивания
      const downloadUrl = build.downloadUrl;
      
      // Открываем ссылку для скачивания
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = build.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onDownload(build.id!, build.platform);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloadingBuild(null);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'android':
      case 'ios':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.apk')) return <Smartphone className="h-4 w-4" />;
    if (fileName.endsWith('.exe')) return <Monitor className="h-4 w-4" />;
    return <FileArchive className="h-4 w-4" />;
  };

  const groupedBuilds = builds.reduce((acc, build) => {
    if (!acc[build.platform]) {
      acc[build.platform] = [];
    }
    acc[build.platform].push(build);
    return acc;
  }, {} as Record<string, GameBuild[]>);

  const canDownload = isFree || isPurchased;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Скачать игру
        </CardTitle>
        <CardDescription>
          Выберите версию для вашей платформы
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price/Purchase Info */}
        {!canDownload && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Для скачивания необходимо приобрести игру за {price} ₽
            </AlertDescription>
          </Alert>
        )}

        {/* Security Notice */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Все файлы проверены на безопасность. Скачивание происходит с защищенных серверов.
          </AlertDescription>
        </Alert>

        {/* Download Options by Platform */}
        <div className="space-y-4">
          {Object.entries(groupedBuilds).map(([platform, platformBuilds]) => (
            <div key={platform} className="space-y-2">
              <div className="flex items-center gap-2">
                {getPlatformIcon(platform)}
                <h4 className="font-medium">{platform}</h4>
                <Badge variant="outline">{platformBuilds.length} версий</Badge>
              </div>
              
              <div className="space-y-2 pl-6">
                {platformBuilds.map((build) => (
                  <div key={build.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(build.fileName)}
                      <div>
                        <div className="font-medium text-sm">{build.fileName}</div>
                        <div className="text-xs text-muted-foreground">
                          Версия {build.version} • {(build.fileSize / 1024 / 1024).toFixed(1)} MB
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Загружено {new Date(build.uploadedAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {canDownload ? (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(build)}
                          disabled={downloadingBuild === build.id}
                        >
                          {downloadingBuild === build.id ? (
                            <>
                              <Download className="h-4 w-4 mr-2 animate-pulse" />
                              Скачивание...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Скачать
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button size="sm" onClick={onPurchase}>
                          Купить за {price} ₽
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {builds.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileArchive className="h-12 w-12 mx-auto mb-2" />
            <p>Файлы для скачивания пока не загружены</p>
          </div>
        )}

        <Separator />

        {/* Additional Info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Автоматические обновления</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Техническая поддержка разработчика</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Возврат средств в течение 14 дней</span>
          </div>
        </div>

        {/* Help Links */}
        <div className="pt-2">
          <div className="text-sm text-muted-foreground mb-2">Нужна помощь?</div>
          <div className="flex gap-4 text-sm">
            <Button variant="link" size="sm" className="p-0 h-auto">
              <ExternalLink className="h-3 w-3 mr-1" />
              Системные требования
            </Button>
            <Button variant="link" size="sm" className="p-0 h-auto">
              <ExternalLink className="h-3 w-3 mr-1" />
              Инструкция по установке
            </Button>
            <Button variant="link" size="sm" className="p-0 h-auto">
              <ExternalLink className="h-3 w-3 mr-1" />
              Связаться с разработчиком
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GameDownload;