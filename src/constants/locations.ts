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
      lat: 54.651940,
      lng: 25.221720
    },
    image: "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2F475686750_122097136736765454_5067661593843921386_n.jpg?alt=media&token=a4867d97-5c3b-449e-9275-9e8ba4e9239d"
  },
  {
    name: "Vilnius Padel",
    address: "Ožiarūčių g 3, Avižieniai, 14185 Vilniaus r. sav.",
    coordinates: {
      lat: 54.668190,
      lng: 25.266770
    },
    image: "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2F480236773_122141966372439504_2950740990188221432_n.jpg?alt=media&token=40240956-8042-4100-8a95-9d6e30de22f2"
  },
  {
    name: "Fanų Padelio Arena",
    address: "Metalo g. 2, Vilnius",
    coordinates: {
      lat: 54.645260,
      lng: 25.266616
    },
    image: "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2FMetalo%20padelis.jpg?alt=media"
  },
  {
    name: "NAUJA Fanų Padelio Arena",
    address: "Plungės g. 4, Vilnius",
    coordinates: {
      lat: 54.659222,
      lng: 25.145812
    },
    image: "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2Fplunges%20padelis.jpg?alt=media"
  },
  {
    name: "Fanų lauko padelio kortai",
    address: "Linkmenų g. 8, Vilnius",
    coordinates: {
      lat: 54.701189,
      lng: 25.269087
    },
    image: "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2FMetalo%20padelis.jpg?alt=media"
  },
  {
    name: "Žirmūnų padelio arena",
    address: "Žirmūnų g. 139, Vilnius",
    coordinates: {
      lat: 54.725464,
      lng: 25.297511
    },
    image: "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2FMetalo%20padelis.jpg?alt=media"
  }
]; 