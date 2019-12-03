/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

var threadId, replyId, threadId2;

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      
      test('Every field filled in', function(done) {
        chai.request(server)
        .post('/api/threads/board')
        .send({board:'board', text: 'POST Chai Every field filled in', delete_password: 'admin'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();  
        });
      });

      test('Every field filled in Again', function(done) {
        chai.request(server)
        .post('/api/threads/board')
        .send({board:'board', text: 'POST Chai Every field filled in', delete_password: 'admin'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();  
        });
      });
      
      test('Missing required fields', function(done){
        chai.request(server)
        .post('/api/threads/board')
        .send({text: 'POST Chai Missing required fields'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'Failed POST. Missing some or all the mandatory fields: Board, Text, Password.');
          done();
        });
      });
    });
    
    suite('GET', function() {
      test('No filter', function(done) {
        chai.request(server)
        .get('/api/threads/board')
        .query({})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'replies');
          assert.property(res.body[0], 'bumped_on');
          assert.isArray(res.body[0].replies);
          assert.notProperty(res.body[0], 'delete_password');
          assert.notProperty(res.body[0], 'reported');
          threadId = res.body[0]._id;
          threadId2 = res.body[1]._id;
          done(); 
        });
      });  
      
    });
    
    suite('PUT', function() {
      test('No body', function(done) {
        chai.request(server)
          .put('/api/threads/board')
          .send({})
          .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'Failed PUT. Missing some or all the mandatory fields: Board, Thread id.');
          done();
        });        
      });
      
      test('No update', function(done) {
        chai.request(server)
          .put('/api/threads/board')
          .send({board: "board", thread_id: "invalidThread"})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'Failed to report thread.');
            done();
          });
      });
      
      test('Field updated', function(done) {
        chai.request(server)
          .put('/api/threads/board')
          .send({board: "board", thread_id: threadId})
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'Success');
            done();
          });
      });
    });
    
    
    suite('DELETE', function() {
      test('Missing required fields', function(done){
        chai.request(server)
        .delete('/api/threads/board')
        .send({delete_password: 'admin'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'Failed DELETE. Missing some or all the mandatory fields: Board, Thread id, Password.');
          done();
        });
      });
      
      test('Incorrect Password', function(done) {
        chai.request(server)
        .delete('/api/threads/board')
        .send({board: 'board', delete_password: 'fake', thread_id: threadId})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'Incorrect Password');
          done();
        });
      });
      
      test('Valid Password', function(done) {
        chai.request(server)
        .delete('/api/threads/board')
        .send({board: 'board', delete_password: 'admin', thread_id: threadId})
        .end(function(err, res) { 
          assert.equal(res.status, 200);
          assert.equal(res.text, 'Success');
          done();
        });
      });
      
    });
    
  });
  
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('Every field filled in and wrong thread', function(done) {
        chai.request(server)
        .post('/api/replies/board')
        .send({board: 'board', thread_id: "wrongThread", text: 'POST Chai Every field filled in', delete_password: 'admin'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'Failed POST. Thread not found.');
          done();
        });      
      });
      
      test('Every field filled in', function(done) {
        chai.request(server)
        .post('/api/replies/board')
        .send({board: 'board', thread_id: threadId2, text: 'POST Chai Every field filled in', delete_password: 'admin'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          done();
        });      
      });
    });
    
    suite('GET', function() {
      test('One filter', function(done) {
        chai.request(server)
        .get('/api/replies/board')
        .query({thread_id: threadId2})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'text');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'replies');
          assert.property(res.body, 'bumped_on');
          assert.isArray(res.body.replies);
          assert.notProperty(res.body, 'delete_password');
          assert.notProperty(res.body, 'reported');
          threadId = res.body._id;
          replyId = res.body.replies[0]._id;
          done(); 
        });
      });
      
    });
    
    suite('PUT', function() {
      test('No body', function(done) {
        chai.request(server)
          .put('/api/replies/board')
          .send({})
          .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'Failed PUT. Missing some or all the mandatory fields: Board, Thread id, Reply id.');
          done();
        });        
      });
      
      test('Field updated', function(done) {
        chai.request(server)
          .put('/api/replies/board')
          .send({board: "board", thread_id: threadId, reply_id: replyId})
          .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'Success');
          done();
        });
      });      
    });
    
    suite('DELETE', function() {
      test('Missing required fields', function(done){
        chai.request(server)
        .delete('/api/replies/board')
        .send({delete_password: 'admin'})
        .end(function(err, res) {
          console.log(res.body);
          assert.equal(res.status, 200);
          assert.equal(res.text, 'Failed DELETE. Missing some or all the mandatory fields: Board, Thread id, Reply id, Password.');
          done();
        });
      });
      
      test('Incorrect Password', function(done) {
        chai.request(server)
        .delete('/api/replies/board')
        .send({board: 'board', delete_password: 'fake', thread_id: threadId, reply_id: replyId})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'Failed to delete reply.');
          done();
        }); 
      }); 
      
      test('Valid Password', function(done) {
        chai.request(server)
        .delete('/api/replies/board')
        .send({board: 'board', delete_password: 'admin', thread_id: threadId, reply_id: replyId})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'Success');
          done(); 
        });
      });
      
      /*
            test('No _id', function(done) {
        chai.request(server)
        .delete('/api/issues/test')
        .query({})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.body.error, "_id error");
          done();
        });
      });

      */
    });
    
  });

});