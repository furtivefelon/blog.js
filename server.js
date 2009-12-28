PORT = 7000
HOST = null;

var b = require('./blog');
var sys = require('sys');

b.listen(PORT, HOST);

b.get('/', b.sendFile('index.html'));
b.post('/new', function(req, res){
  sys.puts('success!');
  req.addListener('bodyLoaded', function(){
    b.sendHTML(JSON.stringify(req.body), res);
  });
});

