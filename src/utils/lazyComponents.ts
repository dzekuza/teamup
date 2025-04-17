import { lazyLoad } from './lazyLoad';

// Lazy load dialog components
export const LazyCreateEventDialog = lazyLoad(() => import('../components/CreateEventDialog'), 'CreateEventDialog');
export const LazyEditEventDialog = lazyLoad(() => import('../components/EditEventDialog'));
export const LazyUserProfileDialog = lazyLoad(() => import('../components/UserProfileDialog'));
export const LazyShareEventDialog = lazyLoad(() => import('../components/ShareEventDialog'));
export const LazyShareMemoryDialog = lazyLoad(() => import('../components/ShareMemoryDialog'), 'ShareMemoryDialog');
export const LazyMatchResultsDialog = lazyLoad(() => import('../components/MatchResultsDialog'));

// Lazy load page components (if needed)
// export const LazyEventDetails = lazyLoad(() => import('../pages/EventDetails'));
// export const LazyProfile = lazyLoad(() => import('../pages/Profile'));

// You can add more lazy-loaded components as needed 