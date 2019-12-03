/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB;

module.exports = function (app) {
  // To fix deprecation warnings from connection to db added {useUnifiedTopology: true }.  
  MongoClient.connect(CONNECTION_STRING, {useUnifiedTopology: true }, function(err, client){ 
    if(err)  throw err; 
    console.log('Successful database connection!');
    
    // From Stackflow: The callback now returns the client, which has a function called db(dbname) that you must invoke to get the db. 
    var db = client.db('messageboard'); 
     
    app.route('/api/threads/:board')
    .get(function(req, res) {
      if(!req.params.board) { 
        res.json({error: "No board specified."}); 
      }else{
        var board = req.params.board;          
        db.collection(board).find({}, {projection: {reported: 0, delete_password: 0,  "replies.reported": 0, "replies.delete_password": 0}})
          .limit(10).toArray(function(err, docs) {
          if(err) throw err;
          res.json(docs);
        });          
      }          
    })
  
    .post(function(req, res) {
      if(!req.params.board || !req.body.text || !req.body.delete_password) {
        res.json({error: "Failed POST. Missing some or all the mandatory fields: Board, Text, Password."}); 
      }else {
        var date = new Date();
        var board = req.params.board;
        var newThread = {text: req.body.text, delete_password: req.body.delete_password, created_on: date,
                         bumped_on: date, reported: false, replies: []};
        db.collection(board).insertOne(newThread, function(err, docs) {
          if(err) throw err;
          res.redirect('/b/'+board);
        });
      }       
    })
  
    .put(function(req, res) {
      if(!req.params.board || !req.body.thread_id) {
        res.send("Failed PUT. Missing some or all the mandatory fields: Board, Thread id.");
      }else{
        var board = req.params.board;
        var threadId = req.body.thread_id;
        if(ObjectId.isValid(threadId)){
          db.collection(board).updateOne({_id: ObjectId(threadId)}, {$set: {reported: true}}, function(err, docs) {
            if(err) throw err;
            res.send("Success");
          });          
        }else {
          res.send("Failed to report thread.");
        }
      }
    })
  
    .delete(function(req, res) {      
      if(!req.params.board || !req.body.thread_id || !req.body.delete_password) {
        res.send("Failed DELETE. Missing some or all the mandatory fields: Board, Thread id, Password.");
      }else{
        var threadId = req.body.thread_id;
        if(ObjectId.isValid(threadId)) {
          var board = req.params.board;
          var pass = req.body.delete_password;
          db.collection(board).deleteOne({_id: ObjectId(threadId), delete_password: pass}, function(err, docs) {
            if(err) throw err;
            docs.deletedCount > 0 ? res.send("Success") : res.send("Incorrect Password");
          });
        }else{
          res.send("Incorrect Password");  
        }
      }
    });
  
      
    app.route('/api/replies/:board')
    .get(function(req, res) {
        if(!req.params.board || !req.query.thread_id) { 
          res.json({error: "No board or thread specified."}); 
        }else{
          var board = req.params.board;
          var threadId = req.query.thread_id;
          if(ObjectId.isValid(threadId)) {
            db.collection(board).findOne({_id: ObjectId(threadId)}, {projection: {delete_password: 0, reported:0, 
              "replies.delete_password":0, "replies.reported": 0}}, function(err, docs) {
              if(err) throw err;
              if(docs) {
                res.json(docs); 
              } else {
                res.json({err: "Thread doesn't exist."});
              }
            });           
          } else {
            res.json({err: "Thread doesn't exist."});
          }
        }           
    })
  
    .post(function(req, res) {
      if(!req.params.board || !req.body.text || !req.body.delete_password || !req.body.thread_id) {
        res.json({error: "Failed POST. Missing some or all the mandatory fields: Board, Text, Password, Thread id."}); 
      }else {
        var board = req.params.board;
        var threadId = req.body.thread_id;
        if(ObjectId.isValid(threadId)) {
          var date =  new Date();
          db.collection(board).findOneAndUpdate({_id: ObjectId(threadId)}, {$set: {bumped_on: date}, $push: {replies: {text: req.body.text, 
            reported: false, created_on: date, delete_password: req.body.delete_password, _id: new ObjectId()}}}, function(err, docs) {
              if(err) throw err;
              res.redirect('/b/' + board + '/' + threadId);
          });
        }else {
          res.json({error: "Failed POST. Thread not found."});
        }        
      }          
    })
  
    .put(function(req, res) {
      if(!req.params.board || !req.body.thread_id || !req.body.reply_id) {
        res.send("Failed PUT. Missing some or all the mandatory fields: Board, Thread id, Reply id.");
      }else{
        var board = req.params.board;
        var threadId = req.body.thread_id;
        var replyId = req.body.reply_id;
        
        if(ObjectId.isValid(threadId) && ObjectId.isValid(replyId)) {
          var reported = true;
          db.collection(board).findOneAndUpdate({_id: ObjectId(threadId), "replies._id": ObjectId(replyId)}, {$set: {"replies.$.reported": true}},
            function(err, docs) {
              if(err) throw err;
              if(docs.value){ res.send("Success"); }else { res.send("Failed to report."); }
          });
        }else {
         res.send("Failed to report."); 
        }
      }      
    })
  
    .delete(function(req, res) {
      if(!req.params.board || !req.body.thread_id || !req.body.delete_password || !req.body.reply_id) {
        res.send("Failed DELETE. Missing some or all the mandatory fields: Board, Thread id, Reply id, Password.");
      }else{
        var board = req.params.board;
        var replyId = req.body.reply_id;
        var threadId = req.body.thread_id;
        var pass = req.body.delete_password;
        if(ObjectId.isValid(threadId) && ObjectId.isValid(replyId)) {
          db.collection(board).findOneAndUpdate({"replies.delete_password": pass, _id: ObjectId(threadId), "replies._id": ObjectId(replyId)}, 
            {$set: {"replies.$.text": "deleted"}}, function(err, docs) {
              if(err) throw err;
              if(docs.value) { 
                res.send("Success");
            }else {
                res.send("Failed to delete reply.");
            } 
          });
        }else {
          res.send("Failed to delete reply.");
        }
      }
    });
  
    //404 Not Found Middleware
    // Moved from server.js to here, otherwise issues running the tests or the routes. Info found on FCC forum, but no explanation.    
    app.use(function(req, res, next) {
    res.status(404)
      .type('text')
      .send('Not Found');
    });
  
  });  // db closeconn
  
}