const mongoose = require('mongoose');
// External File
// Functions (Connection to database)
// Make a unique function name
// Export

const connectDatabase = () => {
  mongoose.connect(process.env.MONGODB_LOCAL).then(() => {
    console.log('Database connected!');
  });
};

// Exporting the function
module.exports = connectDatabase;
