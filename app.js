const express = require('express');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3008;

// Function to generate a random 10-digit number
function generateRandomID() {
  return Math.floor(1000000000 + Math.random() * 9000000000);
}

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization,' + 'cid, user-id, x-auth, Cache-Control, X-Requested-With, datatype, *')
  if (req.method === 'OPTIONS') res.sendStatus(200)
  else next()
});

// Define a route to generate a virtual ID for a user
app.get('/generateVirtualID', async (req, res) => {
  const username = req.query.username;
  const password = req.query.password;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Connect to MongoDB using the environment variables
  const client = new MongoClient(process.env.MONGODB_URL);

  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);

    // Check if the user exists in the database
    const usersCollection = db.collection('allvuser');
    const user = await usersCollection.findOne({ username });

    if (user) {
      // User already exists, return their virtual ID
      return res.json({ virtualID: user.virtualID });
    } else {
      // User does not exist, generate a new virtual ID and store it in the database
      const virtualID = generateRandomID();
      await usersCollection.insertOne({ username, password, virtualID });
      res.json({ virtualID });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    client.close();
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
