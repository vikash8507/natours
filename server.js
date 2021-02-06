const dotenv = require('dotenv');
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
  console.log(err.name, err.message);
  console.log("UNCAUGHT EXCEPTION,", "Server Shutting down the server...");
  process.exit(1);
});

dotenv.config({path: './config.env'});
const app = require('./app');

mongoose.connect(process.env.DATABASE, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}).then(con => console.log("DB connection successful."));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION", "Server Shutting down the server...");
  server.close(() => {
    process.exit(1);
  });
});