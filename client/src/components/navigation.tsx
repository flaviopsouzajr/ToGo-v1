import { Link, useLocation } from "wouter";
import { MapPin, LogIn, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navigation() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-togo-primary rounded-lg flex items-center justify-center">
                <MapPin className="text-white w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-togo-primary">ToGo</span>
            </Link>
            <div className="hidden md:flex space-x-8 ml-8">
              <Link
                href="/"
                className={`transition-colors ${
                  location === "/" 
                    ? "text-togo-primary font-medium" 
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                Início
              </Link>
              {user && (
                <Link
                  href="/places"
                  className={`transition-colors ${
                    location === "/places" 
                      ? "text-togo-primary font-medium" 
                      : "text-gray-700 hover:text-primary"
                  }`}
                >
                  Lugares
                </Link>
              )}
              {user && (
                <Link
                  href="/mapa"
                  className={`transition-colors ${
                    location === "/mapa" 
                      ? "text-togo-primary font-medium" 
                      : "text-gray-700 hover:text-primary"
                  }`}
                >
                  Mapa
                </Link>
              )}
              {user && (
                <Link
                  href="/friends"
                  className={`transition-colors ${
                    location === "/friends" 
                      ? "text-togo-primary font-medium" 
                      : "text-gray-700 hover:text-primary"
                  }`}
                >
                  Amigos
                </Link>
              )}
              {user && (
                <Link
                  href="/feed"
                  className={`transition-colors ${
                    location === "/feed" 
                      ? "text-togo-primary font-medium" 
                      : "text-gray-700 hover:text-primary"
                  }`}
                >
                  Feed
                </Link>
              )}

              <Link
                href="/about"
                className={`transition-colors ${
                  location === "/about" 
                    ? "text-togo-primary font-medium" 
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                Sobre
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <span>{user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full">
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/my-recommendations" className="w-full">
                        Minhas Indicações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="w-full">
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/carousel-admin" className="w-full">
                          Carrossel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="ghost">
                  <Link href="/auth">
                    <LogIn className="mr-2 h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-togo-primary rounded-lg flex items-center justify-center">
                      <MapPin className="text-white w-5 h-5" />
                    </div>
                    <span className="text-2xl font-bold text-togo-primary">ToGo</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-8">
                  <Link
                    href="/"
                    onClick={closeMobileMenu}
                    className={`text-lg py-2 px-4 rounded-lg transition-colors ${
                      location === "/"
                        ? "bg-togo-lightest text-togo-primary font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    data-testid="link-home-mobile"
                  >
                    Início
                  </Link>
                  {user && (
                    <>
                      <Link
                        href="/places"
                        onClick={closeMobileMenu}
                        className={`text-lg py-2 px-4 rounded-lg transition-colors ${
                          location === "/places"
                            ? "bg-togo-lightest text-togo-primary font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        data-testid="link-places-mobile"
                      >
                        Lugares
                      </Link>
                      <Link
                        href="/mapa"
                        onClick={closeMobileMenu}
                        className={`text-lg py-2 px-4 rounded-lg transition-colors ${
                          location === "/mapa"
                            ? "bg-togo-lightest text-togo-primary font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        data-testid="link-map-mobile"
                      >
                        Mapa
                      </Link>
                      <Link
                        href="/friends"
                        onClick={closeMobileMenu}
                        className={`text-lg py-2 px-4 rounded-lg transition-colors ${
                          location === "/friends"
                            ? "bg-togo-lightest text-togo-primary font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        data-testid="link-friends-mobile"
                      >
                        Amigos
                      </Link>
                      <Link
                        href="/feed"
                        onClick={closeMobileMenu}
                        className={`text-lg py-2 px-4 rounded-lg transition-colors ${
                          location === "/feed"
                            ? "bg-togo-lightest text-togo-primary font-medium"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        data-testid="link-feed-mobile"
                      >
                        Feed
                      </Link>
                    </>
                  )}
                  <Link
                    href="/about"
                    onClick={closeMobileMenu}
                    className={`text-lg py-2 px-4 rounded-lg transition-colors ${
                      location === "/about"
                        ? "bg-togo-lightest text-togo-primary font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    data-testid="link-about-mobile"
                  >
                    Sobre
                  </Link>
                  
                  {user && (
                    <>
                      <div className="border-t border-gray-200 my-4"></div>
                      <Link
                        href="/profile"
                        onClick={closeMobileMenu}
                        className="text-lg py-2 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        data-testid="link-profile-mobile"
                      >
                        Perfil
                      </Link>
                      <Link
                        href="/my-recommendations"
                        onClick={closeMobileMenu}
                        className="text-lg py-2 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        data-testid="link-recommendations-mobile"
                      >
                        Minhas Indicações
                      </Link>
                      <Link
                        href="/admin"
                        onClick={closeMobileMenu}
                        className="text-lg py-2 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                        data-testid="link-admin-mobile"
                      >
                        Painel Admin
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/carousel-admin"
                          onClick={closeMobileMenu}
                          className="text-lg py-2 px-4 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                          data-testid="link-carousel-mobile"
                        >
                          Carrossel
                        </Link>
                      )}
                      <Button
                        onClick={handleLogout}
                        variant="outline"
                        className="w-full mt-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid="button-logout-mobile"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </Button>
                    </>
                  )}
                  {!user && (
                    <Button asChild variant="default" className="w-full mt-4 bg-togo-primary hover:bg-togo-secondary" data-testid="button-login-mobile">
                      <Link href="/auth" onClick={closeMobileMenu}>
                        <LogIn className="mr-2 h-4 w-4" />
                        Admin
                      </Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
