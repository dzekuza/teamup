export interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  phone?: string;
  website?: string;
}

export const PADEL_LOCATIONS: Location[] = [
  {
    id: 'mostai',
    name: 'Mostai | Padelio klubas',
    address: 'Savanorių pr. 174, Vilnius',
    lat: 54.6872,
    lng: 25.2797,
  },
  {
    id: 'vilnius-padel',
    name: 'Vilnius Padel',
    address: 'Vilnius, Lithuania',
    lat: 54.6892,
    lng: 25.2798,
  },
  {
    id: 'fanu-metalo',
    name: 'Fanų Padelio Arena (Metalo)',
    address: 'Metalo g. 2, Vilnius',
    lat: 54.6741,
    lng: 25.2615,
  },
  {
    id: 'fanu-plunges',
    name: 'NAUJA Fanų Padelio Arena (Plungės)',
    address: 'Plungės g., Vilnius',
    lat: 54.7103,
    lng: 25.2633,
  },
  {
    id: 'fanu-lauko',
    name: 'Fanų lauko padelio kortai',
    address: 'Vilnius, Lithuania',
    lat: 54.6723,
    lng: 25.2580,
  },
  {
    id: 'zirmunu',
    name: 'Žirmūnų padelio arena',
    address: 'Žirmūnų g., Vilnius',
    lat: 54.7145,
    lng: 25.2925,
  },
];
