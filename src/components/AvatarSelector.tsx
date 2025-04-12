import React from 'react';
import Avatar1 from '../assets/avatars/Avatar1.png';
import Avatar2 from '../assets/avatars/Avatar2.png';
import Avatar3 from '../assets/avatars/Avatar3.png';
import Avatar4 from '../assets/avatars/Avatar4.png';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onSelect: (avatar: string) => void;
  onClose: () => void;
}

const avatars = [
  { src: Avatar1, id: 'Avatar1' },
  { src: Avatar2, id: 'Avatar2' },
  { src: Avatar3, id: 'Avatar3' },
  { src: Avatar4, id: 'Avatar4' },
];

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  selectedAvatar,
  onSelect,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1E1E1E] rounded-3xl p-8 w-full max-w-md">
        <h2 className="text-xl font-medium text-white mb-6 text-center">
          Choose your avatar
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => onSelect(avatar.id)}
              className={`p-2 rounded-xl transition-all ${
                selectedAvatar === avatar.id
                  ? 'ring-2 ring-[#C1FF2F] bg-[#2A2A2A]'
                  : 'hover:bg-[#2A2A2A]'
              }`}
            >
              <img
                src={avatar.src}
                alt={`Avatar ${avatar.id}`}
                className="w-full h-auto rounded-xl"
              />
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#C1FF2F] text-black rounded-xl font-medium hover:bg-[#B1EF1F] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}; 