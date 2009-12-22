PORT = 7000
HOST = null;

var awe = require('./blog');
var sys = require('sys');

awe.listen(PORT, HOST);

awe.get('/', awe.sendFile('index.html'));

