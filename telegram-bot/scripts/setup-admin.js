require('dotenv').config();
const { initializeFirebase } = require('../src/firebase');

async function setupSuperAdmin() {
  try {
    const db = initializeFirebase();
    
    // Add super admin user
    await db.collection('admins').doc('info@gvozdovic.com').set({
      email: 'info@gvozdovic.com',
      role: 'superadmin',
      createdAt: new Date().toISOString()
    });

    // Create initial locations collection
    await db.collection('locations').doc('default').set({
      name: 'Default Location',
      address: 'Please update this location',
      createdAt: new Date().toISOString(),
      createdBy: 'info@gvozdovic.com'
    });

    console.log('✅ Super admin setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up super admin:', error);
    process.exit(1);
  }
}

setupSuperAdmin(); 