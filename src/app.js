// Import required libraries
const express = require('express');
const server = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: '127.0.0.1',
    port: 1227,
    user: 'demo_user',
    password: 'demo_password',
    database: 'demo_user'
  }
});

// Server configurations
const PORT = process.env.PORT || 3000;


// Middleware to allow the acceptance of JSON payloads and parsing of cookies
server.use(bodyParser.urlencoded({ extended: false }));
server.use(cookieParser());

// This route echos back URL params for testing/debugging
server.get('/api/echo/:params', (req, res) => {
  try {
    if (req.params) {
      res.send(req.params);
    } else {
      res.send('Neither params nor queries included in GET request.')
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// This route echos back query params for testing/debugging
server.get('/api/echo', (req, res) => {
  try {
    if (req.query) {
      res.send(req.query);
    } else {
      res.send('No queries included in GET request.')
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// This route echos back JSON payload for testing/debugging
server.post('/api/echo', (req, res) => {
  try {
    if (req.body) {
      res.send(req.body);
    } else {
      res.send('No body present in POST request.')
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }

});

// Log-In Route
server.post('/api/log-in', (req, res) => {
  try {
    if (req.body.SESSION_KEY && req.body.SESSION_PASSWORD) {
      knex('users')
      .select('*')
      .where('email', '=', req.body.SESSION_KEY)
      .whereRaw(`password = crypt('${req.body.SESSION_PASSWORD}', password)`)
      .then((user) => {
        if (user[0]?.id) {
          knex('users')
          .where('id', '=', user[0]?.id)
          .update('session_token', knex.raw('gen_random_uuid ()'))
          .returning('session_token')
          .then((token) => {;
            console.log(...token);
            res.cookie('SESSION_TOKEN', ...token).send('Cookie Set');
          });
          
        } else {
          res.status(400).send('Invalid credentials');
        }
      });
    } else {
      res.status(400).send('Bad request received.')
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// Sign-Up Route
server.post('/api/sign-up', (req, res) => {
  try {
    if (req.body.USERNAME && req.body.EMAIL && req.body.PASSWORD) {
      knex('users')
      .insert({
        email: req.body.EMAIL,
        username: req.body.USERNAME,
        password: knex.raw(`crypt('${req.body.PASSWORD}', gen_salt('md5'))`)
      })
      .then(() => {
        res.status(200).send('User created!');
      });
      
    } else {
      res.status(400).send('Bad Request');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// Log-Out Route
server.post('/api/log-out', (req, res) => {
  try {
    if (req.body.SESSION_KEY && req.body.SESSION_PASSWORD) {

    } else {
      res.status(400).send('Bad request received.')
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});


// Database Query Route (requires token provided by Log-In)
server.get('/api/query', (req, res) => {
  try {
    if (req.cookies.SESSION_TOKEN[0]?.session_token) {
      const SESSION_TOKEN = req.cookies.SESSION_TOKEN[0]?.session_token;
      knex('users')
      .select('username')
      .where('session_token', '=', req.cookies.SESSION_TOKEN[0]?.session_token)
      .then((user) => {
        if (user) {
          res.status(200).send('AUTHORIZED')
        } else {
          res.status(401).send('UNAUTHORIZED')
        }
      });
    } else {
      res.status(401).send('UNAUTHORIZED');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
});

// Database Search Rote (requires token provided by Log-In)
server.get('/api/search', (req, res) => {

});

server.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
})