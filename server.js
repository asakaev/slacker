var http = require('http');
var pg = require('pg').native;
var config = require('./etc/config.json');
var version = require('./package.json').version;

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
    return searchHandler(res, decodeURI(param));
  }

  defaultHandler(res);
};

var searchHandler = function(res, param) {
  var sql = 'SELECT * FROM ' + config.pg.schema + '.' + config.pg.table +
      " WHERE text LIKE '%" + param + "%'";

  client.query(sql, function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }

    res.writeHead(200, {'Content-Type': 'application/json; charset=utf-8'});
    res.end(JSON.stringify(result.rows) + '\n');
  });
};

var defaultHandler = function(res) {
  res.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});
  res.end('🐸 '+ 'v' + version + '\n');
};

http.createServer(router).listen(config.port, config.host);
