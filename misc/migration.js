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


var sputnikMigrate = function(mongo, pg, callback) {
  async.waterfall([
    function(callback) {
      var sputnik = mongo.collection('sputnik');
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
      console.log('Inserting to PostgreSQL...');
      pgInsert(pg, docs, function(error, failed) {
        if (error) {
          console.error('pg insert error:', error);
        }

        callback(null, failed);
      });
    }
  ], callback);
};


var vse35Migrate = function(mongo, pg, callback) {
  console.log('vse35 mock!');
  callback();
};

var disconnect = function(mongo, pg) {
  mongo.close();
  pg.end();
};


var migrate = function(mongo, pg, callback) {
  async.series([
    function(callback) {
      sputnikMigrate(mongo, pg, function(error, failed) {
        console.log('Sputnik complete.');

        if (error) {
          console.log(error);
          disconnect(mongo, pg);
          process.exit(1);
        }

        if (failed) {
          console.log('Failed inserts:', failed);
          disconnect(mongo, pg);
          process.exit(1);
        }

        callback();
      });
    },
    function(callback) {
      vse35Migrate(mongo, pg, callback);
    }
  ], callback);
};


var onBothConnected = function(error, results) {
  if (error) {
    console.log(error);
    process.exit(1);
  }

  console.log('Connected to MongoDB and PostreSQL.');
  var mongo = results[1];
  var pg = results[0];

  migrate(mongo, pg, function() {
    console.log('Done without errors.');
    disconnect(mongo, pg);
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
