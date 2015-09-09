var http = require('http');
var config = require('../etc/config.json');
var async = require('async');


var pgInsert = function(pgClient, docs, callback) {
  var docsPrepared = docs.map(function(doc) {
    return [
      doc.vacancy,
      doc.text,
      doc.idSputnik,
      doc.tel,
      doc.added.getTime(),
      doc.issue
    ];
  });

  async.filter(docsPrepared, function(doc, done) {
    var sql = "INSERT INTO " + config.pg.schema + "." + config.pg.table +
        " (vacancy, text, id_sputnik, tel, added, issue) VALUES" +
        "($1, $2, $3, $4, $5, $6)";

    pgClient.query(sql, doc, function(error, result) {
      if (!error && result.rowCount === 1) {
        done(false);
      } else {
        done(true);
      }
    });
  }, function(errors, result) {
    if (errors.length) {
      callback(errors, result);
    } else {
      callback(null, result);
    }
  });
};


var onBothConnected = function(error, results) {
  if (error) {
    console.log(error);
    process.exit(1);
  }

  console.log('Connected to MongoDB and PostreSQL.');

  var pgClient = results[0];
  var mongoDb = results[1];

  async.waterfall([
    function(callback) {
      var sputnik = mongoDb.collection('sputnik');
      sputnik.find({}).toArray(function (error, docs) {
        if (error) {
          console.log(error);
          return callback(error);
        }

        console.log('Sputnik collection docs:', docs.length);
        callback(null, docs);
      });
    },
    function(docs, callback) {
      console.log('Inserting...');
      pgInsert(pgClient, docs, function(error, failed) {
        if (error) {
          console.error('pg insert error:', error);
        }

        callback(null, failed);
      });
    }
  ],
  function(error, failed) {
    console.log('Complete.');

    mongoDb.close();
    pgClient.end();

    if (error) {
      console.log(error);
    }

    if (failed) {
      console.log('Failed inserts:', failed);
    } else {
      console.log('Done without errors.');
    }
  });
};


// mongodb and postgres connection
async.parallel([
  function(callback) {
    var pg = require('../node_modules/pg').native;

    var username = config.pg.username;
    var pass = config.pg.pass;
    var pghost= config.pg.host;

    var conString = "postgres://" + username + ":" + pass + "@" + pghost + "/" + config.pg.db;
    var client = new pg.Client(conString);
    client.connect(function(error) {
      callback(error, client);
    });
  },
  function(callback) {
    var MongoClient = require('mongodb').MongoClient;
    var url = 'mongodb://localhost:27017/work';
    MongoClient.connect(url, callback);
  }
], onBothConnected);
