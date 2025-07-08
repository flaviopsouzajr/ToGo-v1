import React from 'react';
import { PlacesMap } from '@/components/places-map';
import { Navigation } from '@/components/navigation';
import { ProtectedRoute } from '@/lib/protected-route';

function MapPageContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mapa dos Lugares</h1>
          <p className="text-gray-600">
            Visualize todos os seus lugares cadastrados no mapa do Brasil. Clique nos marcadores para ver detalhes.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4">
            <PlacesMap />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <ProtectedRoute>
      <MapPageContent />
    </ProtectedRoute>
  );
}