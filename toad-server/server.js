var http = require('http');
var pg = require('pg').native;
var config = requre('./config.json');

var username = config.pg.username;
var pass = config.pg.pass;

var conString = "postgres://" + username + ":" + pass + "@localhost/" + config.pg.db;
var client = new pg.Client(conString);
client.connect();

var sql = 'SELECT * FROM ' + config.pg.schema + '.' + config.pg.table +' WHERE id = 1';

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});

  client.query(sql, function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }

    res.end('Here we go! 🐸\n' + JSON.stringify(result.rows) + '\n');
  });

}).listen(config.port, config.port);

