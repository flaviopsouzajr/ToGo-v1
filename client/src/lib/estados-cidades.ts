import estadosCidadesJson from "@assets/estados-cidades2_1751032892548.json";

export interface State {
  id: string;
  name: string;
}

export interface City {
  state_id: number;
  id: number;
  name: string;
}

export const states: State[] = Object.entries(estadosCidadesJson.states).map(([id, name]) => ({
  id,
  name,
}));

export const cities: City[] = estadosCidadesJson.cities;

export function getCitiesByState(stateId: string): City[] {
  const numericStateId = parseInt(stateId);
  return cities.filter(city => city.state_id === numericStateId);
}

export function getStateName(stateId: string): string {
  return estadosCidadesJson.states[stateId as keyof typeof estadosCidadesJson.states] || "";
}

export function getCityName(cityId: number): string {
  const city = cities.find(c => c.id === cityId);
  return city?.name || "";
}
