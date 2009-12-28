PORT = 7000
HOST = null;

var b = require('./blog');
var sys = require('sys');

b.listen(PORT, HOST);

b.get('/', b.sendHTML(process.platform));

