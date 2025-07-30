const bcrypt = require('bcryptjs');

// Simple function to hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Direct database query to add user
async function addSuperAdmin() {
  try {
    // This is a simple script to add the user directly
    console.log('Adding superadmin user...');
    console.log('Email: admin@top-league.org');
    console.log('Password: password');
    console.log('Role: admin');
    
    // The password hash for 'password' is:
    const passwordHash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    console.log('Password hash:', passwordHash);
    console.log('User should be added to database with these credentials.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addSuperAdmin(); 