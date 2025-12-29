const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    console.log("Mongo URI:", process.env.MONGODB_URI);
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`Noiceee, MongoDB Connected: ${conn.connection.host}`);
    console.log(`The Database is: ${conn.connection.name}`);
  } catch (error) {
    console.error(`Sorry, but there was a MongoDB Error: ${error.message}`);
    console.log('Unfortunately,  Server will run without database connection');
  }
};

module.exports = connectDB;