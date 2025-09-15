// components/SimpleHeader.tsx
import { Link, useLocation } from "react-router-dom";
import { Search, User, Menu, LogOut, Settings, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const SimpleHeader = () => {
  const location = useLocation();
  const { currentUser, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Ошибка выхода:", error);
    }
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">GH</span>
            </div>
            <span className="font-bold text-xl text-foreground">GameHub</span>
          </Link>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Поиск игр, разработчиков, тегов..." 
                className="pl-10"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm">
            <Link 
              to="/" 
              className={`hover:text-primary transition-colors ${
                location.pathname === "/" ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              Каталог
            </Link>
            {currentUser && (
              <Link 
                to="/dashboard" 
                className={`hover:text-primary transition-colors ${
                  location.pathname.includes("/dashboard") ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                Мой кабинет
              </Link>
            )}
            <Link 
              to="/companies" 
              className={`hover:text-primary transition-colors ${
                location.pathname === "/companies" ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              Компании
            </Link>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile?.photoURL || currentUser.photoURL || ''} alt={userProfile?.displayName || currentUser.displayName || ''} />
                        <AvatarFallback>
                          {(userProfile?.displayName || currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {userProfile?.displayName || currentUser.displayName || 'Пользователь'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser.email}
                        </p>
                        {userProfile?.userType && (
                          <p className="text-xs leading-none text-muted-foreground">
                            {userProfile.userType === 'developer' ? 'Разработчик' : 'Компания'}
                            {userProfile.userType === 'company' && !userProfile.verified && (
                              <span className="text-orange-500"> • Не подтверждено</span>
                            )}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <Library className="mr-2 h-4 w-4" />
                        <span>Библиотека</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Профиль</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Настройки</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="cursor-pointer text-red-600"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Выйти</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Войти</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Регистрация</Link>
                </Button>
              </>
            )}
            
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Поиск игр..." 
              className="pl-10"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;