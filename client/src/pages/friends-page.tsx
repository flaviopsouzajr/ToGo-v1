import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, Search, UserPlus, Trash2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Link } from "wouter";
import type { FriendWithUser, User } from "@shared/schema";

export function FriendsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch friends list
  const { data: friends = [], isLoading: friendsLoading } = useQuery<FriendWithUser[]>({
    queryKey: ["/api/friends"],
  });

  // Add friend mutation
  const addFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      return apiRequest("/api/friends", {
        method: "POST",
        body: { friendId },
      });
    },
    onSuccess: (_, friendId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      
      // Find the added friend's username for the toast
      const addedFriend = searchResults.find(user => user.id === friendId);
      toast({
        title: "Amigo adicionado!",
        description: `Agora você está seguindo ${addedFriend?.username || 'este usuário'}.`,
      });
      
      // Clear search results
      setSearchQuery("");
      setSearchResults([]);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao adicionar amigo.",
        variant: "destructive",
      });
    },
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (friendId: number) => {
      return apiRequest(`/api/friends/${friendId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      toast({
        title: "Amigo removido",
        description: "Você não está mais seguindo este usuário.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao remover amigo.",
        variant: "destructive",
      });
    },
  });

  // Search users
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await apiRequest(`/api/search-users?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar usuários.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isFriend = (userId: number) => {
    return friends.some(friend => friend.friendId === userId);
  };

  return (
    <>
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Users className="w-8 h-8 text-togo-primary" />
          Amigos
        </h1>
        <p className="text-gray-600">
          Gerencie sua lista de amigos e descubra suas recomendações de lugares.
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Adicionar Novo Amigo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Buscar por nome de usuário ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? "Buscando..." : "Buscar"}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Resultados da busca:</h4>
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addFriendMutation.mutate(user.id)}
                    disabled={isFriend(user.id) || addFriendMutation.isPending}
                  >
                    {isFriend(user.id) ? (
                      "Já é amigo"
                    ) : addFriendMutation.isPending ? (
                      "Adicionando..."
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Adicionar Amigo
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Friends List */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Meus Amigos ({friends.length})
        </h2>

        {friendsLoading ? (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Carregando amigos...</div>
          </div>
        ) : friends.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum amigo ainda
              </h3>
              <p className="text-gray-600 mb-4">
                Use a busca acima para encontrar e adicionar amigos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {friends.map((friendship) => (
              <Card key={friendship.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{friendship.friend.username}</h3>
                      <p className="text-sm text-gray-600">{friendship.friend.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFriendMutation.mutate(friendship.friendId)}
                      disabled={removeFriendMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/friend-profile/${friendship.friendId}`}>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 w-full"
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        Ver Perfil
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Amigo desde {new Date(friendship.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
      <Footer />
    </>
  );
}