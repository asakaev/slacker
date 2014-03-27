var winston = require('winston');
//winston.add(winston.transports.File, { filename: 'somefile.log' });
//winston.remove(winston.transports.Console);

// winston.remove(winston.transports.Console);
//winston.log('info', 'Hello distributed log files!');
//winston.info('Hello again distributed logs');

var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Check near zero Nodemon update.\n');
  //winston.info(new Date() + ': Who is there?');
  // console.log(new Date());
}).listen(1337, '192.168.1.2');
console.log('Server running at http://192.168.1.2:1337/');
