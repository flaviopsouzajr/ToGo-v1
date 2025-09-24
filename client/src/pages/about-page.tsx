import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Star, Route } from "lucide-react";
import { Link } from "wouter";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Sobre</h1>
        </div>

        {/* Main Content */}
        <Card className="mb-12">
          <CardContent className="p-8 md:p-12">
            <div className="prose prose-lg max-w-none text-center">
              <p className="text-lg leading-relaxed text-gray-700 mb-0 text-justify">
                Este sistema foi desenvolvido para facilitar o cadastro, organização e visualização de lugares para visitar, sejam restaurantes, cidades, pontos turísticos ou eventos. Com ele, é possível gerenciar de forma prática informações detalhadas de cada lugar, como localização, categorias, avaliação, status de visita, além de visualizar imagens e roteiros associados. Nosso objetivo é tornar o planejamento de viagens, passeios ou experiências gastronômicas mais simples, visual e organizado.
              </p>
            </div>
          </CardContent>
        </Card>

        
      </div>
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="md:max-w-md">
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

            <div className="md:text-right text-left">
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
    </div>
  );
}