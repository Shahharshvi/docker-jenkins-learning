const express = require('express');
const path = require('path');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get('/profile-picture', function (req, res) {
  const img = fs.readFileSync(path.join(__dirname, "images/profile-1.jpg"));
  res.writeHead(200, {'Content-Type': 'image/jpg' });
  res.end(img, 'binary');
});

// use when starting application locally
const mongoUrlLocal = "mongodb://admin:password@localhost:27017";

// use when starting application as docker container
const mongoUrlDocker = "mongodb://admin:password@mongodb";

// pass these options to mongo client connect request to avoid DeprecationWarning for current Server Discovery and Monitoring engine
const mongoClientOptions = { useNewUrlParser: true, useUnifiedTopology: true };

// "user-account" in demo with docker. "my-db" in demo with docker-compose
const databaseName = "user-accounts"; // Database name
const collectionName = "users"; // Collection name

app.post('/update-profile', function (req, res) {
  const userObj = req.body;

  MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).send("Error connecting to MongoDB");
      return;
    }

    const db = client.db(databaseName);
    userObj['userid'] = 1;

    const myquery = { userid: 1 };
    const newvalues = { $set: userObj };

    db.collection(collectionName).updateOne(myquery, newvalues, { upsert: true }, function (err, result) {
      if (err) {
        console.error("Error updating profile:", err);
        res.status(500).send("Error updating profile");
        client.close();
        return;
      }
      console.log("Profile updated successfully:", result);
      client.close();
      res.send(userObj);
    });
  });
});

app.get('/get-profile', function (req, res) {
  MongoClient.connect(mongoUrlLocal, mongoClientOptions, function (err, client) {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).send("Error connecting to MongoDB");
      return;
    }

    const db = client.db(databaseName);

    const myquery = { userid: 1 };

    db.collection(collectionName).findOne(myquery, function (err, result) {
      if (err) {
        console.error("Error fetching profile:", err);
        res.status(500).send("Error fetching profile");
        client.close();
        return;
      }
      console.log("Profile fetched successfully:", result);
      client.close();
      res.send(result ? result : {});
    });
  });
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
  console.log(`Server is running on http://localhost:${port}`);
});
