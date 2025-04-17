import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PADEL_LOCATIONS, Location } from '../constants/locations';
import Map, { Marker } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Event } from '../types';
import { EventCard } from '../components/EventCard';
import { ArrowCircleUp as ArrowUpIcon, Add as AddIcon, ArrowBack as ArrowBackIcon, Star as StarIcon, StarHalf as StarHalfIcon, StarBorder as StarBorderIcon, AccessTime as TimeIcon, Info as InfoIcon, Phone as PhoneIcon } from '@mui/icons-material';
import { CreateEventDialog } from '../components/CreateEventDialog';

// Helper function to recursively convert Firebase Timestamp objects to strings
const convertTimestampsToStrings = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // If it's a Timestamp or has toDate function, convert to ISO string
  if (obj instanceof Timestamp || (obj && typeof obj.toDate === 'function')) {
    try {
      if (obj.toDate) {
        return obj.toDate().toISOString();
      }
      return obj;
    } catch (error) {
      console.error('Error converting timestamp:', error);
      return obj;
    }
  }
  
  // If it's an array, convert each item
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestampsToStrings(item));
  }
  
  // If it's an object, convert each property
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = convertTimestampsToStrings(obj[key]);
      }
    }
    return newObj;
  }
  
  // Return primitive values as is
  return obj;
};

// Mock working hours data (in a real app, this would come from a database)
const MOCK_WORKING_HOURS = {
  "Mostai | Padelio klubas": {
    monday: "07:00 - 23:00",
    tuesday: "07:00 - 23:00",
    wednesday: "07:00 - 23:00",
    thursday: "07:00 - 23:00",
    friday: "07:00 - 23:00",
    saturday: "08:00 - 22:00",
    sunday: "08:00 - 22:00"
  },
  "Vilnius Padel": {
    monday: "08:00 - 22:00",
    tuesday: "08:00 - 22:00",
    wednesday: "08:00 - 22:00",
    thursday: "08:00 - 22:00",
    friday: "08:00 - 22:00",
    saturday: "09:00 - 21:00",
    sunday: "09:00 - 21:00"
  },
  "Fanų Padelio Arena": {
    monday: "08:00 - 23:00",
    tuesday: "08:00 - 23:00",
    wednesday: "08:00 - 23:00",
    thursday: "08:00 - 23:00",
    friday: "08:00 - 23:00",
    saturday: "09:00 - 22:00",
    sunday: "09:00 - 22:00"
  },
  "NAUJA Fanų Padelio Arena": {
    monday: "07:00 - 23:00",
    tuesday: "07:00 - 23:00",
    wednesday: "07:00 - 23:00",
    thursday: "07:00 - 23:00",
    friday: "07:00 - 23:00",
    saturday: "08:00 - 22:00",
    sunday: "08:00 - 22:00"
  },
  "Fanų lauko padelio kortai": {
    monday: "08:00 - 21:00",
    tuesday: "08:00 - 21:00",
    wednesday: "08:00 - 21:00",
    thursday: "08:00 - 21:00",
    friday: "08:00 - 21:00",
    saturday: "09:00 - 20:00",
    sunday: "09:00 - 20:00"
  },
  "Žirmūnų padelio arena": {
    monday: "07:00 - 22:00",
    tuesday: "07:00 - 22:00",
    wednesday: "07:00 - 22:00",
    thursday: "07:00 - 22:00",
    friday: "07:00 - 22:00",
    saturday: "08:00 - 21:00",
    sunday: "08:00 - 21:00"
  }
};

// Mock description data (in a real app, this would come from a database)
const MOCK_DESCRIPTIONS = {
  "Mostai | Padelio klubas": "Mostai Padel Club is a premier padel facility in Vilnius, featuring 6 indoor courts with professional-grade surfaces. The club offers a welcoming atmosphere for players of all skill levels, with modern amenities including locker rooms, showers, and a comfortable lounge area. Whether you're a beginner or advanced player, Mostai provides excellent facilities for both casual games and competitive matches.",
  "Vilnius Padel": "Vilnius Padel is one of the city's newest padel venues, offering state-of-the-art courts in a convenient location. The facility features 4 indoor courts with excellent lighting and premium surfaces. With comfortable changing rooms, a pro shop, and friendly staff, Vilnius Padel provides everything needed for an excellent padel experience.",
  "Fanų Padelio Arena": "Fanų Padel Arena on Metalo Street is a favorite among local padel enthusiasts. This facility features 6 professional courts, excellent lighting, and a vibrant atmosphere. The venue offers equipment rental, professional coaching, and regular tournaments. With ample parking and a convenient location, it's an excellent choice for padel players across Vilnius.",
  "NAUJA Fanų Padelio Arena": "The new Fanų Padel Arena on Plungės Street is the latest addition to Vilnius' padel scene. This modern facility features 8 premium courts with perfect playing conditions year-round. The spacious venue includes comfortable changing facilities, a café area, and professional coaching services. It's quickly becoming one of the most popular places to play padel in the city.",
  "Fanų lauko padelio kortai": "Fanų outdoor padel courts on Linkmenų Street offer a fantastic opportunity to play padel in the fresh air during the warmer months. The facility features 4 well-maintained outdoor courts with professional surfaces. Players appreciate the natural lighting and relaxed atmosphere. The courts are particularly popular during spring and summer.",
  "Žirmūnų padelio arena": "Žirmūnų Padel Arena is a comfortable and accessible padel venue in the Žirmūnai district. The facility offers 4 indoor courts with quality playing surfaces and good lighting. The venue provides all necessary amenities including changing rooms, equipment rental, and coaching options. Its location makes it particularly convenient for players from the northern parts of Vilnius."
};

// Mock reviews data (in a real app, this would come from a database)
const MOCK_REVIEWS = {
  "Mostai | Padelio klubas": [
    { id: 1, author: "Tomas K.", rating: 5, text: "Excellent facilities, very well maintained courts. Staff is super friendly.", date: "2025-03-15" },
    { id: 2, author: "Laura M.", rating: 4, text: "Great place to play padel. Only giving 4 stars because it can get busy in the evenings.", date: "2025-03-10" },
    { id: 3, author: "Marius P.", rating: 5, text: "Best padel courts in Vilnius! Love playing here every week.", date: "2025-02-28" }
  ],
  "Vilnius Padel": [
    { id: 1, author: "Jonas R.", rating: 4, text: "Nice new venue with good courts. A bit out of the way but worth the trip.", date: "2025-03-18" },
    { id: 2, author: "Ieva K.", rating: 5, text: "High quality courts and excellent service. Will definitely come back!", date: "2025-03-05" }
  ],
  "Fanų Padelio Arena": [
    { id: 1, author: "Andrius V.", rating: 5, text: "Great atmosphere and professional courts. Highly recommended!", date: "2025-03-12" },
    { id: 2, author: "Greta S.", rating: 4, text: "Good facility, though the parking can be a challenge during peak hours.", date: "2025-02-20" },
    { id: 3, author: "Lukas J.", rating: 5, text: "My favorite place to play padel in Vilnius!", date: "2025-02-15" }
  ],
  "NAUJA Fanų Padelio Arena": [
    { id: 1, author: "Viktorija L.", rating: 5, text: "Amazing new facility! Everything is top-notch.", date: "2025-03-20" },
    { id: 2, author: "Darius P.", rating: 5, text: "The best padel courts I've played on. Great location too.", date: "2025-03-08" }
  ],
  "Fanų lauko padelio kortai": [
    { id: 1, author: "Simona R.", rating: 4, text: "Love playing outdoors when the weather is nice. Good courts.", date: "2025-03-14" },
    { id: 2, author: "Mantas T.", rating: 3, text: "Nice courts but obviously weather dependent. Would be great to have better shelter options for light rain.", date: "2025-02-25" }
  ],
  "Žirmūnų padelio arena": [
    { id: 1, author: "Aistė K.", rating: 4, text: "Convenient location and good courts. Friendly staff too.", date: "2025-03-17" },
    { id: 2, author: "Robertas M.", rating: 4, text: "Good place to play. Courts are well maintained.", date: "2025-03-01" }
  ]
};

// Mock contact information (in a real app, this would come from a database)
const MOCK_CONTACT = {
  "Mostai | Padelio klubas": {
    phone: "+370 600 12345",
    email: "info@mostaipadel.lt",
    website: "www.mostaipadel.lt"
  },
  "Vilnius Padel": {
    phone: "+370 600 23456",
    email: "info@vilniuspadel.lt",
    website: "www.vilniuspadel.lt"
  },
  "Fanų Padelio Arena": {
    phone: "+370 600 34567",
    email: "info@fanupadel.lt",
    website: "www.fanupadel.lt"
  },
  "NAUJA Fanų Padelio Arena": {
    phone: "+370 600 45678",
    email: "info@fanupadel.lt",
    website: "www.fanupadel.lt"
  },
  "Fanų lauko padelio kortai": {
    phone: "+370 600 56789",
    email: "info@fanupadel.lt",
    website: "www.fanupadel.lt"
  },
  "Žirmūnų padelio arena": {
    phone: "+370 600 67890",
    email: "info@zirmunapadel.lt",
    website: "www.zirmunapadel.lt"
  }
};

// Mock image gallery data (in a real app, this would come from a database)
const MOCK_GALLERY = {
  "Mostai | Padelio klubas": [
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2F475686750_122097136736765454_5067661593843921386_n.jpg?alt=media&token=a4867d97-5c3b-449e-9275-9e8ba4e9239d",
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1",
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2FMetalo%20padelis.jpg?alt=media"
  ],
  "Vilnius Padel": [
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2F480236773_122141966372439504_2950740990188221432_n.jpg?alt=media&token=40240956-8042-4100-8a95-9d6e30de22f2",
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1"
  ],
  "Fanų Padelio Arena": [
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2FMetalo%20padelis.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1"
  ],
  "NAUJA Fanų Padelio Arena": [
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2Fplunges%20padelis.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1"
  ],
  "Fanų lauko padelio kortai": [
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2FMetalo%20padelis.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1"
  ],
  "Žirmūnų padelio arena": [
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2FMetalo%20padelis.jpg?alt=media",
    "https://firebasestorage.googleapis.com/v0/b/newprojecta-36c09.firebasestorage.app/o/Locations%2Fstatic%20cover.jpg?alt=media&token=4c319254-5854-4b3c-9bc7-e67cfe1a58b1"
  ]
};

// Simple star rating component
const StarRating: React.FC<{rating: number}> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex text-[#C1FF2F]">
      {[...Array(fullStars)].map((_, i) => (
        <StarIcon key={`full-${i}`} />
      ))}
      {hasHalfStar && <StarHalfIcon />}
      {[...Array(emptyStars)].map((_, i) => (
        <StarBorderIcon key={`empty-${i}`} />
      ))}
    </div>
  );
};

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

const SingleLocation: React.FC = () => {
  const { locationId } = useParams<{locationId: string}>();
  const navigate = useNavigate();
  const [location, setLocation] = useState<Location | null>(null);
  const [viewState, setViewState] = useState<ViewState>({
    longitude: 25.2797, // Default to Vilnius
    latitude: 54.6872,
    zoom: 14
  });
  const [locationEvents, setLocationEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [workingHours, setWorkingHours] = useState<any>(null);
  const [description, setDescription] = useState<string>("");
  const [reviews, setReviews] = useState<any[]>([]);
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Find location by name (or slug if you implement proper URL slugs)
  useEffect(() => {
    const decodedName = decodeURIComponent(locationId || '');
    const foundLocation = PADEL_LOCATIONS.find(loc => loc.name === decodedName);
    
    if (foundLocation) {
      setLocation(foundLocation);
      setViewState({
        longitude: foundLocation.coordinates.lng,
        latitude: foundLocation.coordinates.lat,
        zoom: 14
      });
      
      // Set working hours
      const hours = MOCK_WORKING_HOURS[foundLocation.name as keyof typeof MOCK_WORKING_HOURS];
      setWorkingHours(hours || null);
      
      // Set description
      const desc = MOCK_DESCRIPTIONS[foundLocation.name as keyof typeof MOCK_DESCRIPTIONS];
      setDescription(desc || "No description available for this location.");
      
      // Set reviews
      const revs = MOCK_REVIEWS[foundLocation.name as keyof typeof MOCK_REVIEWS];
      setReviews(revs || []);
      
      // Set contact info
      const contact = MOCK_CONTACT[foundLocation.name as keyof typeof MOCK_CONTACT];
      setContactInfo(contact || null);
      
      // Set gallery images
      const gallery = MOCK_GALLERY[foundLocation.name as keyof typeof MOCK_GALLERY];
      setGalleryImages(gallery || []);
    } else {
      // Location not found, redirect to locations page
      navigate('/locations');
    }
  }, [locationId, navigate]);
  
  // Fetch events for this location
  useEffect(() => {
    const fetchEventsForLocation = async () => {
      if (!location) return;
      
      setIsLoading(true);
      try {
        const eventsQuery = query(
          collection(db, 'events'),
          where('location', '==', location.name)
        );
        
        const querySnapshot = await getDocs(eventsQuery);
        const events: Event[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Apply the recursive conversion to handle all nested timestamps
          const processedData = convertTimestampsToStrings(data);
          
          const event = {
            id: doc.id,
            ...processedData,
            // These specific fields are crucial, ensure they're correctly formatted
            date: data.date && typeof data.date.toDate === 'function' ? 
              data.date.toDate().toISOString().split('T')[0] : processedData.date,
          };
          
          events.push(event as Event);
        });
        
        // Sort events by date (most recent first)
        events.sort((a, b) => {
          const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
          const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
          return dateA.getTime() - dateB.getTime();
        });
        
        setLocationEvents(events);
      } catch (error) {
        console.error('Error fetching events for location:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventsForLocation();
  }, [location]);
  
  const handleEventUpdated = () => {
    // Refresh events after an event is updated
    if (location) {
      const fetchEvents = async () => {
        try {
          const eventsQuery = query(
            collection(db, 'events'),
            where('location', '==', location.name)
          );
          
          const querySnapshot = await getDocs(eventsQuery);
          const events: Event[] = [];
          
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Apply the recursive conversion to handle all nested timestamps
            const processedData = convertTimestampsToStrings(data);
            
            const event = {
              id: doc.id,
              ...processedData,
              // These specific fields are crucial, ensure they're correctly formatted
              date: data.date && typeof data.date.toDate === 'function' ? 
                data.date.toDate().toISOString().split('T')[0] : processedData.date,
            };
            
            events.push(event as Event);
          });
          
          events.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
            const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
            return dateA.getTime() - dateB.getTime();
          });
          
          setLocationEvents(events);
        } catch (error) {
          console.error('Error refreshing events:', error);
        }
      };
      
      fetchEvents();
    }
  };

  const handleEventCreated = () => {
    setIsCreateDialogOpen(false);
    handleEventUpdated();
  };

  // When the user opens the create event dialog, ensure the selected location is pre-selected
  useEffect(() => {
    if (isCreateDialogOpen && location) {
      localStorage.setItem('preselectedLocation', location.name);
    }
  }, [isCreateDialogOpen, location]);
  
  // If location is not found, show loading or redirect
  if (!location) {
    return (
      <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C1FF2F]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-white pb-24 md:pb-8 relative">
      {/* Header with back button */}
      <div className="sticky top-0 z-40 bg-[#121212]/80 backdrop-blur-md shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/locations')}
              className="p-2 rounded-full bg-[#2A2A2A] text-gray-300 hover:text-white"
            >
              <ArrowBackIcon />
            </button>
            <h1 className="text-2xl font-bold">{location.name}</h1>
          </div>
        </div>
      </div>
      
      {/* Location Hero Section with Image Gallery */}
      <div className="relative max-w-4xl mx-auto w-full h-64 md:h-80 overflow-hidden md:mt-6 md:rounded-lg z-10">
        {/* Main cover image */}
        <img 
          src={galleryImages[activeImageIndex] || location.image} 
          alt={location.name} 
          className="w-full h-full object-cover md:rounded-lg"
        />
        
        {/* Gradient overlay - reducing the height to not cover entire content */}
        <div className="absolute inset-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
        
        {/* Image gallery thumbnails */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 px-4 z-20">
          {galleryImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setActiveImageIndex(index)}
              className={`w-12 h-12 rounded-md overflow-hidden border-2 ${
                activeImageIndex === index ? 'border-[#C1FF2F]' : 'border-white/50'
              }`}
            >
              <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>
      
      {/* Main Content Grid */}
      <div className="max-w-4xl mx-auto px-4 py-6 relative z-20 pointer-events-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Description and Map */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-[#1E1E1E] rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4 flex items-center">
                <InfoIcon className="mr-2 text-[#C1FF2F]" />
                About {location.name}
              </h2>
              <p className="text-gray-300">{description}</p>
              
              {/* Sport Type */}
              <div className="mt-4 flex items-center">
                <span className="bg-[#2A2A2A] px-3 py-1 rounded-full text-sm font-medium">
                  {location.sportType || 'Padel'}
                </span>
              </div>
              
              {/* Address */}
              <div className="mt-4">
                <h3 className="font-medium text-[#C1FF2F]">Address</h3>
                <p className="text-gray-300">{location.address}</p>
              </div>
            </div>
            
            {/* Map */}
            <div className="bg-[#1E1E1E] rounded-xl p-6 shadow-md">
              <h2 className="text-xl font-bold mb-4">Location Map</h2>
              <div className="h-64 rounded-xl overflow-hidden">
                <Map
                  mapLib={Promise.resolve(maplibregl)}
                  initialViewState={viewState}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="https://api.maptiler.com/maps/streets-v2-dark/style.json?key=33rTk4pHojFrbxONf77X"
                  attributionControl={false}
                >
                  <Marker
                    longitude={location.coordinates.lng}
                    latitude={location.coordinates.lat}
                  >
                    <div className="w-6 h-6 bg-[#C1FF2F] rounded-full flex items-center justify-center transform -translate-x-3 -translate-y-3">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </Marker>
                </Map>
              </div>
            </div>
            
            {/* Reviews (Moved from right column) */}
            <div className="bg-[#1E1E1E] rounded-xl p-6 shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Reviews</h2>
                {reviews.length > 0 && (
                  <div className="flex items-center">
                    <StarRating rating={reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length} />
                    <span className="ml-2">
                      {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-800 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center">
                        <div className="font-medium">{review.author}</div>
                        <StarRating rating={review.rating} />
                      </div>
                      <div className="text-gray-400 text-sm">{review.date}</div>
                      <div className="mt-2 text-gray-300">{review.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No reviews yet.</p>
              )}
            </div>
          </div>
          
          {/* Right Column: Working Hours, Contact */}
          <div className="space-y-6">
            {/* Create Event Button moved to bottom "No events" section */}
            
            {/* Working Hours */}
            {workingHours && (
              <div className="bg-[#1E1E1E] rounded-xl p-6 shadow-md">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <TimeIcon className="mr-2 text-[#C1FF2F]" />
                  Working Hours
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Monday</span>
                    <span>{workingHours.monday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tuesday</span>
                    <span>{workingHours.tuesday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wednesday</span>
                    <span>{workingHours.wednesday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Thursday</span>
                    <span>{workingHours.thursday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Friday</span>
                    <span>{workingHours.friday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Saturday</span>
                    <span>{workingHours.saturday}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sunday</span>
                    <span>{workingHours.sunday}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Contact Information */}
            {contactInfo && (
              <div className="bg-[#1E1E1E] rounded-xl p-6 shadow-md">
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <PhoneIcon className="mr-2 text-[#C1FF2F]" />
                  Contact Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-gray-400">Phone</div>
                    <div>{contactInfo.phone}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Email</div>
                    <div>{contactInfo.email}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Website</div>
                    <div>{contactInfo.website}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Upcoming Events Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Upcoming Events at {location.name}</h2>
            <button
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2 bg-[#C1FF2F] text-black px-4 py-2 rounded-xl font-medium hover:bg-[#B1EF1F] transition-colors"
            >
              <AddIcon />
              Create Event
            </button>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C1FF2F]"></div>
            </div>
          ) : locationEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {locationEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event}
                  onEventUpdated={handleEventUpdated}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#1E1E1E] rounded-xl p-8 text-center">
              <p className="text-gray-400">No upcoming events at this location</p>
              <button
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4 flex items-center gap-2 bg-[#C1FF2F] text-black px-4 py-2 rounded-xl font-medium hover:bg-[#B1EF1F] transition-colors mx-auto"
              >
                <AddIcon />
                Create an event here
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Create Event Dialog */}
      <CreateEventDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};

export default SingleLocation; 