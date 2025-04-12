import React, { FC } from 'react';

interface LocationPickerProps {
  onLocationSelect: (location: { name: string; address: string; coordinates: { lat: number; lng: number; } }) => void;
  defaultLocation?: { name: string; address: string; coordinates: { lat: number; lng: number; } };
}

export const LocationPicker: FC<LocationPickerProps> = ({ onLocationSelect, defaultLocation }) => {
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Enter location"
        defaultValue={defaultLocation?.name || ''}
        onChange={(e) => {
          onLocationSelect({
            name: e.target.value,
            address: e.target.value,
            coordinates: { lat: 0, lng: 0 }
          });
        }}
        className="w-full p-2 border rounded-lg bg-[#2A2A2A] border-gray-600 text-white"
      />
    </div>
  );
}; 