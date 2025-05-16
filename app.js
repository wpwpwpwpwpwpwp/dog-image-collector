const express = require('express');
const session = require('express-session');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const PORT = process.env.PORT;

//express app
const app = express();

//middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false
}));
//setup views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//mongodb
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let database;
let collection;

async function connectToMongoDB() {
  try {
    await client.connect();
    database = client.db(process.env.MONGO_DB_NAME);
    collection = database.collection(process.env.MONGO_COLLECTION);
    console.log('Connected to MongoDB');
    
    //routes importing
    const authRoutes = require('./routes/auth')(collection);
    const dashboardRoutes = require('./routes/dashboard')(collection);
    
    app.use('/', authRoutes);
    app.use('/dashboard', dashboardRoutes);
    
    //webserver start
    const webServer = app.listen(PORT, () => {
      console.log(`Web server started and running at http://localhost:${PORT}`);
      process.stdin.setEncoding("utf8");
      const prompt = "Type stop to shutdown the server: ";
      process.stdout.write(prompt);
      process.stdin.on("readable", function () {
        const dataInput = process.stdin.read();
        if (dataInput !== null) {
          const command = dataInput.trim();
          if (command === "stop") {
            process.stdout.write("Shutting down the server\n");
            process.exit(0);
          } else {
            process.stdout.write(`Invalid command: ${command}\n`);
          }
          process.stdout.write(prompt);
          process.stdin.resume();
        }
      });
    });
  } catch (e) {
    console.error('MongoDB connection error:', e);
  }
}

connectToMongoDB().catch(console.error);