var http = require('http');
var config = require('../etc/config.json');
var async = require('async');
var knex = require('knex')({client: 'pg'});


var convertVse35 = function(doc) {
  delete doc._id;
  doc.added = doc.added.getTime();

  if (doc.edited) {
    doc.edited = doc.edited.getTime();
  }

  if (doc.vse35Id) {
    doc.vse35_id = doc.vse35Id;
    delete doc.vse35Id;
  }

  if (doc.priceCustom){
    doc.price_custom = doc.priceCustom;
    delete doc.priceCustom;
  }

  if (doc.paymentPeriod) {
    doc.payment_period = doc.paymentPeriod;
    delete doc.paymentPeriod;
  }

  if (doc.workSchedule){
    doc.work_schedule = doc.workSchedule;
    delete doc.workSchedule;
  }

  if (doc.authorDetailName) {
    doc.author_detail_name = doc.authorDetailName;
    delete doc.authorDetailName;
  }

  if (doc.authorDetailId) {
    doc.author_detail_id = doc.authorDetailId;
    delete doc.authorDetailId;
  }

  return doc;
};


var convertSputnik = function(doc) {
  delete doc._id;

  doc.added = doc.added.getTime();

  if (doc.idSputnik) {
    doc.id_sputnik = doc.idSputnik;
    delete doc.idSputnik;
  }

  return doc;
};


var insertHandler = function(error, result, countWas, callback) {
  if (error) {
    return callback(error);
  }

  var diff = countWas - result.rowCount;
  var diffError;

  if (diff) {
    diffError = new Error('WARN: ' + diff + ' rows are not inserted.');
    console.log(diffError);
  }

  callback(diffError);
};


var pgInsert = function(pg, docs, callback) {
  var table = config.pg.schema + '.' + config.pg.table;
  var sql = knex(table).insert(docs).toString();

  pg.query(sql, function(error, result) {
    insertHandler(error, result, docs.length, callback);
  });
};


var migrateRun = function(mongo, pg, collection, callback) {
  async.waterfall([
    function(callback) {
      var col = mongo.collection(collection);
      var mapFunc;

      if (collection === 'sputnik') {
        mapFunc = convertSputnik;
      } else if (collection === 'vse35vacancies') {
        mapFunc = convertVse35;
      } else {
        console.log('Unknown collection');
        process.exit(1);
      }

      col.find({}).map(mapFunc).toArray(function (error, docs) {
        if (error) {
          console.log(error);
          return callback(error);
        }

        console.log(collection + ' collection docs:', docs.length);
        callback(null, docs);
      });
    },
    function(docs, callback) {
      console.log('Inserting to PostgreSQL...');
      pgInsert(pg, docs, callback);
    }
  ], callback);
};


var disconnect = function(mongo, pg) {
  mongo.close();
  pg.end();
};


var migrate = function(mongo, pg, callback) {
  async.series([
    function(callback) {
      migrateRun(mongo, pg, 'sputnik', function(error) {
        console.log('Sputnik complete.');
        callback(error);
      });
    },
    function(callback) {
      migrateRun(mongo, pg, 'vse35vacancies', function(error) {
        console.log('Vse35 complete.');
        callback(error);
      });
    }
  ], function(error) {
    if (error) {
      console.log(error);
      disconnect(mongo, pg);
      process.exit(1);
    }

    callback();
  });
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
