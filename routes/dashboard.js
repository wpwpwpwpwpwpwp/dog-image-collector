const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = function(collection) {
  const router = express.Router();
  
  //check if user is logged invia session
  const isAuthenticated = (req, res, next) => {
    if (!req.session.userId) {
      return res.redirect('/login');
    }
    next();
  };
  
  router.get('/', isAuthenticated, async (req, res) => {
    try {
      //stroing id to objectid
      let objectId;
      try {
        objectId = ObjectId.createFromHexString(req.session.userId);
      } catch (error) {
        req.session.destroy();
        return res.redirect('/login');
      }
      
      //user lookup
      const filter = { _id: objectId };
      const user = await collection.findOne(filter);
      
      //if not user destroy session
      if (!user) {
        req.session.destroy();
        return res.redirect('/login');
      }
      
      res.render('dashboard', { 
        user,
        dogs: user.savedDogs || []
      });
    } catch (e) {
      res.redirect('/login');
    }
  });
  
  //route for dog saving
  router.post('/save-dog', isAuthenticated, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.json({ success: false, message: 'No URL provided' });
      }
      
      let objectId;
      try {
        objectId = ObjectId.createFromHexString(req.session.userId);
      } catch (e) {
        return res.json({ success: false, message: 'Invalid user ID format' });
      }
      
      //add dog image to array 
      const filter = { _id: objectId };
      const update = {
        $push: {
          savedDogs: {
            url: url,
            savedAt: new Date()
          }
        }
      };
      
      const result = await collection.updateOne(filter, update);
      
      if (result.modifiedCount === 1 || result.matchedCount === 1) {
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'failed to save image, user not found' });
      }
    } catch (e) {
      res.json({ success: false, message: 'error: ' + e.message });
    }
  });
  
  return router;
};