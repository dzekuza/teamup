import React from 'react';

const SPORTS = [
  { id: '', name: 'All', icon: '🌐' },
  { id: 'Padel', name: 'Padel', icon: '🏸' },
  { id: 'Tennis', name: 'Tennis', icon: '🎾' },
  { id: 'Running', name: 'Running', icon: '🏃' },
  { id: 'Soccer', name: 'Soccer', icon: '⚽' },
  { id: 'Basketball', name: 'Basketball', icon: '🏀' },
  { id: 'Cycling', name: 'Cycling', icon: '🚴' },
];

interface SportTypeFilterProps {
  selectedSportType: string;
  onChange: (sportType: string) => void;
}

export const SportTypeFilter: React.FC<SportTypeFilterProps> = ({
  selectedSportType,
  onChange,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-0 pt-2">
      <div className="flex space-x-6 px-4">
        {SPORTS.map((sport) => (
          <button
            key={sport.id}
            onClick={() => onChange(sport.id)}
            className={`flex min-w-[64px] flex-col items-center justify-center rounded-lg shadow-lg transition-all duration-200 hover:scale-105`}
          >
            <div 
              className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-all duration-200 ${
                selectedSportType === sport.id
                  ? 'bg-[#C1FF2F] text-black scale-110 shadow-[0_0_10px_rgba(193,255,47,0.3)]'
                  : 'text-white'
              }`}
            >
              {sport.icon}
            </div>
            <span className={`text-sm font-medium transition-colors duration-200 ${
              selectedSportType === sport.id ? 'text-[#C1FF2F]' : 'text-gray-300'
            }`}>
              {sport.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}; 