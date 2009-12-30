PORT = 7000
HOST = null;
BLOG_PREFIX = '/home/jasonwang/Documents/javascript/node/apps/blog.js';
POSTS = '/posts';
TEMPLATE = '/templates';

var b = require('./b');
require('./underscore/underscore');
var sys = require('sys');
var posix = require('posix');

postdir = BLOG_PREFIX+POSTS+'/';
templatedir = BLOG_PREFIX+TEMPLATE+'/';

b.listen(PORT, HOST);

function template(temp, data){
  var t = posix.cat(templatedir+temp, 'utf8').wait();
  var output = _.template(t, data);
  return output;
}

b.get('^/$', function(req, res){
  posix.readdir(postdir).addCallback(function(files){
    titles = _.map(files, function(file){
      var post = postdir+file;
      var ret;
      var stats = posix.stat(postdir+file).wait();
      if(stats.isFile()){
        var data = posix.cat(postdir+file, 'utf8').wait();
        ret = JSON.parse(data)['title'];
      } else {
        sys.puts(post + ' is not a valid file!');
        ret = 0;
      }
      return ret;
    });
    titles = {'titles':titles};
    var html = template('list.html', titles);
    res.sendHTML(html);
  });
});

b.get('^/addForm$', b.sendFile('index.html'));
b.post('/new', function(req, res){
  var data = JSON.stringify(req.params);
  var file = postdir + req.params['title'];
  var promise = posix.open(file, process.O_WRONLY|process.O_CREAT|process.O_TRUNC, 0666)
  promise.addCallback(function(fd){
    posix.write(fd, data, null, 'UTF8').addCallback(function(written){
      sys.puts(written+' bytes are written');
      var html = template('new.html', req.params);
      res.sendHTML(html);
    });
  });
  promise.addErrback(function(){
    sys.puts('Error loading '+file);
  });
});


b.get('^/view/([a-zA-Z0-9]+)$', function(req, res, title){
  file = postdir+title;
  data = posix.cat(file, 'utf8').wait();
  data = JSON.parse(data);
  var html = template('new.html', data);
  res.sendHTML(html);
});

b.setStaticPath(BLOG_PREFIX, '/static');

