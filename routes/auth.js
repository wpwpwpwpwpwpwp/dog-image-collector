const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = function(collection) {
  const router = express.Router();
  
  //login redirect
  router.get('/', (req, res) => {
    res.redirect('/login');
  });
  
  router.get('/login', (req, res) => {
    if (req.session.userId) {
      return res.redirect('/dashboard');
    }
    res.render('login', { error: null });
  });
  
  router.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      //user search for login
      const filter = { username: username, password: password };
      const user = await collection.findOne(filter);
      
      if (!user) {
        return res.render('login', { error: 'Invalid username or password' });
      }
      
      //session set
      req.session.userId = user._id.toString();
      res.redirect('/dashboard');
    } catch (e) {
      res.render('login', { error: 'An error occurred' });
    }
  });
  
  router.get('/register', (req, res) => {
    if (req.session.userId) {
      return res.redirect('/dashboard');
    }
    res.render('register', { error: null });
  });
  
  //register form
  router.post('/register', async (req, res) => {
    try {
      const { username, password, confirmPassword } = req.body;
      
      //password check
      if (password !== confirmPassword) {
        return res.render('register', { error: 'Passwords do not match' });
      }
      
      //user exists check
      const existingUser = await collection.findOne({ username });
      if (existingUser) {
        return res.render('register', { error: 'Username already exists' });
      }
      
      const user = {
        username,
        password,
        savedDogs: []
      };
      
      //user is saved to database via insert
      const result = await collection.insertOne(user);      
      //set session then go to dashboard
      req.session.userId = result.insertedId.toString();
      res.redirect('/dashboard');
    } catch (e) {
      res.render('register', { error: 'An error occurred' });
    }
  });
  
  //endpoint to logout
  router.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        console.error(err);
      }
      res.redirect('/login');
    });
  });
  
  return router;
};