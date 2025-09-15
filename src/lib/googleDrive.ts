// lib/googleDrive.ts
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';

// Google Drive API configuration
// Проверяем, что переменные окружения определены
const GOOGLE_DRIVE_API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY || '';
const GOOGLE_DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '';

export interface GameBuild {
  id?: string;
  gameId: string;
  fileName: string;
  fileSize: number;
  driveFileId: string;
  downloadUrl: string;
  platform: string;
  version: string;
  uploadedAt: any;
  creatorId: string;
}

export interface GameData {
  id?: string;
  title: string;
  developer: string;
  developerId: string;
  shortDescription: string;
  fullDescription: string;
  genre: string;
  platforms: string[];
  price: number;
  isFree: boolean;
  coverImageUrl: string;
  screenshots: string[];
  tags: string[];
  status: 'draft' | 'published' | 'rejected';
  createdAt: any;
  updatedAt: any;
  rating: number;
  downloadCount: number;
  builds: GameBuild[];
}

class GoogleDriveService {
  private apiKey = GOOGLE_DRIVE_API_KEY;
  private folderId = GOOGLE_DRIVE_FOLDER_ID;

  async uploadFile(file: File, gameId: string, platform: string): Promise<string> {
    // Проверяем, что API ключ настроен
    if (!this.apiKey) {
      console.warn('Google Drive API key не настроен, используется демо режим');
    }

    // В реальном приложении здесь будет загрузка на Google Drive
    // Для демо создаем имитацию
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', `${gameId}_${platform}_${file.name}`);
    formData.append('parents', this.folderId || '');

    try {
      // Имитация загрузки - в реальности используйте Google Drive API
      const mockFileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Сохраняем информацию о файле в Firestore
      const buildData: Omit<GameBuild, 'id'> = {
        gameId,
        fileName: file.name,
        fileSize: file.size,
        driveFileId: mockFileId,
        downloadUrl: `https://drive.google.com/file/d/${mockFileId}/download`,
        platform,
        version: '1.0.0', // В реальности получать из формы
        uploadedAt: new Date(),
        creatorId: '' // Заполнять из контекста авторизации
      };

      const docRef = await addDoc(collection(db, 'builds'), buildData);
      return docRef.id;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Ошибка загрузки файла');
    }
  }

  async getDownloadUrl(fileId: string): Promise<string> {
    // Генерируем прямую ссылку для скачивания
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  async deleteFile(fileId: string): Promise<void> {
    // Удаление файла с Google Drive
    if (!this.apiKey) {
      console.warn('Google Drive API key не настроен');
      return;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?key=${this.apiKey}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

// Games Service для работы с играми в Firestore
class GamesService {
  async createGame(gameData: Omit<GameData, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'games'), {
        ...gameData,
        createdAt: new Date(),
        updatedAt: new Date(),
        rating: 0,
        downloadCount: 0,
        builds: []
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating game:', error);
      throw new Error('Ошибка создания игры');
    }
  }

  async updateGame(gameId: string, gameData: Partial<GameData>): Promise<void> {
    try {
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, {
        ...gameData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating game:', error);
      throw new Error('Ошибка обновления игры');
    }
  }

  async getGames(filters?: {
    genre?: string;
    platform?: string;
    isFree?: boolean;
    search?: string;
    sortBy?: 'newest' | 'popular' | 'rating' | 'price_low' | 'price_high';
    lastDoc?: QueryDocumentSnapshot<DocumentData>;
    limitCount?: number;
  }): Promise<{ games: GameData[], lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
    try {
      let gameQuery = query(
        collection(db, 'games'),
        where('status', '==', 'published')
      );

      // Применяем фильтры
      if (filters?.genre) {
        gameQuery = query(gameQuery, where('genre', '==', filters.genre));
      }

      if (filters?.platform) {
        gameQuery = query(gameQuery, where('platforms', 'array-contains', filters.platform));
      }

      if (filters?.isFree !== undefined) {
        gameQuery = query(gameQuery, where('isFree', '==', filters.isFree));
      }

      // Сортировка
      switch (filters?.sortBy) {
        case 'newest':
          gameQuery = query(gameQuery, orderBy('createdAt', 'desc'));
          break;
        case 'popular':
          gameQuery = query(gameQuery, orderBy('downloadCount', 'desc'));
          break;
        case 'rating':
          gameQuery = query(gameQuery, orderBy('rating', 'desc'));
          break;
        case 'price_low':
          gameQuery = query(gameQuery, orderBy('price', 'asc'));
          break;
        case 'price_high':
          gameQuery = query(gameQuery, orderBy('price', 'desc'));
          break;
        default:
          gameQuery = query(gameQuery, orderBy('createdAt', 'desc'));
      }

      // Пагинация
      if (filters?.lastDoc) {
        gameQuery = query(gameQuery, startAfter(filters.lastDoc));
      }

      gameQuery = query(gameQuery, limit(filters?.limitCount || 12));

      const querySnapshot = await getDocs(gameQuery);
      const games: GameData[] = [];
      let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

      querySnapshot.forEach((doc) => {
        games.push({ id: doc.id, ...doc.data() } as GameData);
        lastDoc = doc;
      });

      // Если есть поисковый запрос, фильтруем на клиенте
      // В продакшене лучше использовать Algolia или Elasticsearch
      let filteredGames = games;
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredGames = games.filter(game => 
          game.title.toLowerCase().includes(searchTerm) ||
          game.developer.toLowerCase().includes(searchTerm) ||
          game.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      // Дополнительная сортировка по цене на клиенте если нужно
      if (filters?.sortBy === 'price_low' || filters?.sortBy === 'price_high') {
        filteredGames.sort((a, b) => {
          return filters.sortBy === 'price_low' ? a.price - b.price : b.price - a.price;
        });
      }

      return { games: filteredGames, lastDoc };
    } catch (error) {
      console.error('Error fetching games:', error);
      throw new Error('Ошибка загрузки игр');
    }
  }

  async getGameById(gameId: string): Promise<GameData | null> {
    try {
      // Здесь должен быть запрос к Firestore
      // Возвращаем mock данные для демонстрации
      return null;
    } catch (error) {
      console.error('Error fetching game:', error);
      return null;
    }
  }

  async addBuildToGame(gameId: string, buildId: string): Promise<void> {
    try {
      // Получаем информацию о билде
      const buildsQuery = query(
        collection(db, 'builds'),
        where('gameId', '==', gameId)
      );
      const buildsSnapshot = await getDocs(buildsQuery);
      const builds: GameBuild[] = [];
      
      buildsSnapshot.forEach((doc) => {
        builds.push({ id: doc.id, ...doc.data() } as GameBuild);
      });

      // Обновляем игру с новым списком билдов
      const gameRef = doc(db, 'games', gameId);
      await updateDoc(gameRef, {
        builds: builds,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error adding build to game:', error);
      throw new Error('Ошибка добавления билда к игре');
    }
  }
}

export const googleDriveService = new GoogleDriveService();
export const gamesService = new GamesService();