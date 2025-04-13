export interface Location {
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  image: string;
}

export const PADEL_LOCATIONS: Location[] = [
  {
    name: "Mostai | Padelio klubas",
    address: "Savanorių pr. 178B, Vilnius, 03154 Vilniaus m. sav.",
    coordinates: {
      lat: 54.6872,
      lng: 25.2797
    },
    image: "/locations/Mostai.png"
  },
  {
    name: "Vilnius Padel",
    address: "Ožiarūčių g 3, Avižieniai, 14185 Vilniaus r. sav.",
    coordinates: {
      lat: 54.7234,
      lng: 25.3189
    },
    image: "/locations/Vilniuspadel.jpg"
  }
]; 