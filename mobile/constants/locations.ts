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
    address: 'Savanorių pr. 178B, Vilnius',
    lat: 54.651940,
    lng: 25.221720,
  },
  {
    id: 'vilnius-padel',
    name: 'Vilnius Padel',
    address: 'Ožiarūčių g 3, Avižieniai',
    lat: 54.668190,
    lng: 25.266770,
  },
  {
    id: 'fanu-metalo',
    name: 'Fanų Padelio Arena',
    address: 'Metalo g. 2, Vilnius',
    lat: 54.645260,
    lng: 25.266616,
  },
  {
    id: 'fanu-plunges',
    name: 'NAUJA Fanų Padelio Arena',
    address: 'Plungės g. 4, Vilnius',
    lat: 54.659222,
    lng: 25.145812,
  },
  {
    id: 'fanu-lauko',
    name: 'Fanų lauko padelio kortai',
    address: 'Linkmenų g. 8, Vilnius',
    lat: 54.701189,
    lng: 25.269087,
  },
  {
    id: 'zirmunu',
    name: 'Žirmūnų padelio arena',
    address: 'Žirmūnų g. 139, Vilnius',
    lat: 54.725464,
    lng: 25.297511,
  },
];
