import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Route } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-togo-primary rounded-xl flex items-center justify-center">
              <MapPin className="text-white w-7 h-7" />
            </div>
            <span className="text-4xl font-bold text-gray-900">ToGo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Sobre o Sistema
          </h1>
        </div>

        {/* Main Content */}
        <Card className="mb-12">
          <CardContent className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none text-center">
              <p className="text-lg leading-relaxed text-gray-700 mb-0">
                Este sistema foi desenvolvido para facilitar o cadastro, organização e visualização de lugares para visitar, sejam restaurantes, cidades, pontos turísticos ou eventos. Com ele, é possível gerenciar de forma prática informações detalhadas de cada lugar, como localização, categorias, avaliação, status de visita, além de visualizar imagens e roteiros associados. Nosso objetivo é tornar o planejamento de viagens, passeios ou experiências gastronômicas mais simples, visual e organizado.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-togo-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-white w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Organize</h3>
            <p className="text-gray-600">
              Cadastre e organize seus lugares favoritos de forma simples e intuitiva.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-togo-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Star className="text-white w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Avalie</h3>
            <p className="text-gray-600">
              Registre suas experiências e avaliações para compartilhar com outros usuários.
            </p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-togo-light rounded-xl flex items-center justify-center mx-auto mb-4">
              <Route className="text-white w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Planeje</h3>
            <p className="text-gray-600">
              Crie roteiros personalizados e acompanhe o status dos lugares visitados.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-togo-lightest rounded-xl p-8 mt-12 text-center">
          <h3 className="text-2xl font-bold text-togo-primary mb-4">
            Descubra, Explore e Compartilhe
          </h3>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Junte-se a uma comunidade que valoriza experiências únicas e descobertas incríveis. 
            Com o ToGo, cada lugar se torna uma nova aventura esperando para ser explorada.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-togo-primary rounded-lg flex items-center justify-center">
              <MapPin className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold">ToGo</span>
          </div>
          <p className="text-gray-400">
            Sua plataforma completa para descobrir e catalogar os melhores lugares para visitar.
          </p>
        </div>
      </footer>
    </div>
  );
}