var ip = '192.168.1.2';
var ip2 = 'localhost';

var http = require('http');
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Check near zero Nodemon update.\n');
  	console.log(new Date() + ': Who is there?');
}).listen(1337, ip);
console.log('Server running at http://192.168.1.2:1337/');