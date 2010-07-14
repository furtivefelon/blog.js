PORT = 7000
HOST = null;
BLOG_PREFIX = '/Users/aaron/Projects/git/forks/blog.js';
POSTS = '/posts';
TEMPLATE = '/templates';

var b = require('./b');
require('./underscore/underscore');
var sys = require('sys');
var fs = require('fs');

postdir = BLOG_PREFIX+POSTS+'/';
templatedir = BLOG_PREFIX+TEMPLATE+'/';

b.listen(PORT, HOST);

function template(temp, data){
  var t = fs.readFileSync(templatedir+temp, 'utf8');
  var output = _.template(t, data);
  return output;
}

b.get('^/$', function(req, res){
  fs.readdir(postdir,function(err,files){
    titles = _.map(files, function(file){
      var post = postdir+file;
      var ret;
      var stats = fs.statSync(postdir+file);
      if(stats.isFile()){
        var data = fs.readFileSync(postdir+file, 'utf8');
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
  var promise = fs.open(file, process.O_WRONLY|process.O_CREAT|process.O_TRUNC, 0666,function(err,fd){
    fs.write(fd, data, null, 'UTF8',function(err,written){
      if(err){
        sys.puts('Error loading '+file);
      }
      sys.puts(written+' bytes are written');
      var html = template('new.html', req.params);
      res.sendHTML(html);
    });
  });
});


b.get('^/view/([a-zA-Z0-9]+)$', function(req, res, title){
  file = postdir+title;
  data = fs.readFileSync(file, 'utf8');
  data = JSON.parse(data);
  var html = template('new.html', data);
  res.sendHTML(html);
});

b.setStaticPath(BLOG_PREFIX, '/static');

