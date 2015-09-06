var http = require('http');
var pg = require('pg').native;
var config = require('./etc/config.json');

var username = config.pg.username;
var pass = config.pg.pass;
var pghost= config.pg.host;

var conString = "postgres://" + username + ":" + pass + "@" + pghost + "/" +
    config.pg.db;

var client = new pg.Client(conString);
client.connect();

var router = function(req, res) {
  var url = req.url;
  var split = url.split('/');
  var action = split[1];
  var param = split[2];

  if (action === 'search' && param) {
    return searchHandler(res, param);
  }

  defaultHandler(res);
};

var searchHandler = function(res, param) {
  res.writeHead(200, {'Content-Type': 'text/plain'});

  var sql = 'SELECT * FROM ' + config.pg.schema + '.' + config.pg.table +
      " WHERE text LIKE '%" + param + "%'";

  client.query(sql, function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }

    if (result.rows[0]) {
      res.end(JSON.stringify(result.rows[0]) + '\n');
    } else {
      res.end('{}\n');
    }
  });
};

var defaultHandler = function(res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('🐸\n');
};

http.createServer(router).listen(config.port, config.host);
