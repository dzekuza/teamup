# WebPadel - Find Your Padel Partner

WebPadel is a web application that helps padel players find partners and organize games. Users can create events, join existing ones, and manage their padel activities.

## Features

- User authentication (sign up, login, logout)
- Create padel events with details like title, location, level, and price
- Browse existing events
- Join/leave events (maximum 4 players per event)
- View event details and participant information

## Tech Stack

- React with TypeScript
- Material-UI for components
- Firebase for authentication and database
- React Router for navigation

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a Firebase project and enable Authentication and Firestore
4. Update the Firebase configuration in `src/firebase.ts` with your project's credentials

5. Start the development server:
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Contributing

Feel free to submit issues and enhancement requests!
