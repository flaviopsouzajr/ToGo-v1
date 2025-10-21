import { MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-8">
          <div className="w-full md:max-w-md">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-togo-primary rounded-lg flex items-center justify-center">
                <MapPin className="text-white w-6 h-6" />
              </div>
              <span className="text-xl md:text-2xl font-bold">ToGo</span>
            </div>
            <p className="text-sm md:text-base text-gray-400 mb-6 max-w-md">
              Descubra, registre e compartilhe os lugares mais incríveis para visitar em todo o Brasil.
            </p>
          </div>

          <div className="w-full md:w-auto md:text-right">
            <h4 className="font-semibold mb-3 md:mb-4 text-base md:text-lg">Contato</h4>
            <ul className="space-y-2 text-sm md:text-base text-gray-400">
              <li>contato@togo.com.br</li>
              <li>(11) 9999-9999</li>
              <li>São Paulo, SP</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 md:mt-12 pt-6 md:pt-8 text-center text-sm md:text-base text-gray-400">
          <p>© 2025 ToGo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
