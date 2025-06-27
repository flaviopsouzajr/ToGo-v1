import { Link, useLocation } from "wouter";
import { MapPin, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navigation() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
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
              <span className="text-2xl font-bold togo-primary">ToGo</span>
            </Link>
            <div className="hidden md:flex space-x-8 ml-8">
              <Link
                href="/"
                className={`transition-colors ${
                  location === "/" 
                    ? "togo-primary font-medium" 
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                Início
              </Link>
              <Link
                href="/places"
                className={`transition-colors ${
                  location === "/places" 
                    ? "togo-primary font-medium" 
                    : "text-gray-700 hover:text-primary"
                }`}
              >
                Lugares
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <span>{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="w-full">
                      Painel Admin
                    </Link>
                  </DropdownMenuItem>
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
        </div>
      </div>
    </nav>
  );
}
