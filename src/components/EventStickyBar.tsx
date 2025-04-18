import React from 'react';
import { Event, User } from '../types';
import { Button } from './ui/button';
// Remove unused icons
// import { 
//   Share as ShareIcon, 
//   Edit as EditIcon,
//   Bookmark as BookmarkIcon,
//   BookmarkBorder as BookmarkBorderIcon,
//   Delete as DeleteIcon
// } from '@mui/icons-material';
// Keep icons needed for Join/Leave potentially, or remove if using text only
// import { PersonAdd as PersonAddIcon, Logout as LogoutIcon } from '@mui/icons-material';

interface EventStickyBarProps {
  event: Event | null;
  user: User | null;
  isJoined: boolean;
  isPastEvent: boolean; 
  onJoin: () => void;
  onLeave: () => void;
  isLoading: boolean; // To disable buttons during actions
  // Remove props for unused buttons
  // isCreator: boolean;
  // isSaved: boolean;
  // onEdit: () => void;
  // onShare: () => void;
  // onSave: () => void;
  // onDelete?: () => void;
  // savingEvent: boolean;
}

export const EventStickyBar: React.FC<EventStickyBarProps> = ({
  event,
  user,
  isJoined,
  isPastEvent,
  onJoin,
  onLeave,
  isLoading,
}) => {
  if (!event || !user) {
    return null;
  }

  const isFull = event.players.filter(Boolean).length >= event.maxPlayers;
  const canJoin = !isJoined && !isPastEvent && !isFull;
  const canLeave = isJoined && !isPastEvent;

  let buttonText = 'Event Finished';
  let buttonOnClick = () => {};
  let buttonClassName = 'bg-gray-600 text-gray-400 cursor-not-allowed';
  let isDisabled = true;

  if (canJoin) {
    buttonText = 'Join event';
    buttonOnClick = onJoin;
    buttonClassName = 'bg-[#C1FF2F] text-black hover:bg-[#a4e620]';
    isDisabled = isLoading;
  } else if (canLeave) {
    buttonText = 'Leave event';
    buttonOnClick = onLeave;
    buttonClassName = 'bg-red-600 text-white hover:bg-red-700';
    isDisabled = isLoading;
  } else if (!isPastEvent && isFull) {
    buttonText = 'Event Full';
    buttonClassName = 'bg-gray-600 text-gray-400 cursor-not-allowed';
    isDisabled = true;
  } // else it remains "Event Finished"

  return (
    // Container only visible on md+ screens, adjust positioning and width/centering
    <div className="fixed bottom-0 left-0 right-0 z-40 hidden md:block p-4 pointer-events-none">
      {/* Centered container with styling matching the reference - change to rounded-lg */}
      <div className="max-w-xs mx-auto border border-white/20 bg-black/30 backdrop-blur-md rounded-lg shadow-lg p-1 pointer-events-auto">
        <Button
          className={`w-full h-12 rounded-lg text-base font-medium transition-colors ${buttonClassName}`}
          onClick={buttonOnClick}
          disabled={isDisabled}
        >
          {isLoading && (canJoin || canLeave) ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            buttonText
          )}
        </Button>
      </div>
    </div>
  );
}; 