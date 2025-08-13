import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import type { ActivityWithDetails } from "@shared/schema";

function getActivityText(activity: ActivityWithDetails): string {
  const friendName = activity.user.name || activity.user.username;
  
  switch (activity.type) {
    case 'nova_indicacao':
      return `${friendName} adicionou um novo lugar em sua lista de indicações: ${activity.place?.name || 'Local removido'}`;
    case 'nova_avaliacao':
      return `${friendName} avaliou ${activity.place?.name || 'Local removido'} com nota ${activity.newRating}`;
    case 'alteracao_avaliacao':
      return `${friendName} alterou a avaliação de ${activity.place?.name || 'Local removido'} de ${activity.oldRating} para ${activity.newRating}`;
    default:
      return `${friendName} realizou uma atividade`;
  }
}

function ActivityCard({ activity }: { activity: ActivityWithDetails }) {
  const friendName = activity.user.name || activity.user.username;
  const friendInitials = friendName.substring(0, 2).toUpperCase();
  const friendProfileUrl = `/friend-profile/${activity.user.id}`;
  
  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Link href={friendProfileUrl}>
            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
              {activity.user.profilePictureUrl && (
                <AvatarImage src={activity.user.profilePictureUrl} alt={friendName} />
              )}
              <AvatarFallback className="bg-green-100 text-green-700">
                {friendInitials}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <Link href={friendProfileUrl}>
                <p className="text-sm font-medium cursor-pointer hover:text-togo-primary transition-colors">
                  {friendName}
                </p>
              </Link>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(activity.createdAt), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {getActivityText(activity)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      {activity.place && (
        <CardContent className="pt-0">
          <div className="bg-gray-50 rounded-lg p-3 mt-2">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-sm">{activity.place.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {activity.place.type?.name} • {activity.place.cityName}, {activity.place.stateName}
                </p>
              </div>
              {activity.newRating && (
                <Badge variant="secondary" className="text-xs">
                  ⭐ {activity.newRating}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-togo-primary rounded-lg flex items-center justify-center">
                <MapPin className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold">ToGo</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Sua plataforma completa para descobrir e catalogar os melhores lugares para visitar em todo o Brasil.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Links Úteis</h4>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/places" className="hover:text-white transition-colors">
                  Lugares
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  Sobre
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-2 text-gray-400">
              <li>contato@togo.com.br</li>
              <li>(11) 9999-9999</li>
              <li>São Paulo, SP</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>© 2025 ToGo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default function FeedPage() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ["/api/feed"],
    queryFn: async () => {
      const response = await fetch("/api/feed", { credentials: "include" });
      if (!response.ok) {
        throw new Error("Erro ao carregar feed");
      }
      return response.json() as Promise<ActivityWithDetails[]>;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold ml-4">Feed de Atividades</h1>
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="w-full">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold ml-4">Feed de Atividades</h1>
          </div>
          
          <Card className="w-full">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Erro ao carregar o feed. Tente novamente mais tarde.
              </p>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto p-4">
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <h1 className="text-2xl font-bold ml-4">Feed de Atividades</h1>
          </div>
          
          <Card className="w-full">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Nenhuma atividade recente</h3>
              <p className="text-muted-foreground mb-4">
                As atividades dos seus amigos aparecerão aqui quando eles adicionarem novos lugares ou avaliações.
              </p>
              <Link href="/friends">
                <Button variant="outline">
                  Ver Amigos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold ml-4">Feed de Atividades</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}