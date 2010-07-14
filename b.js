var CS = require('http').createServer;
var fs = require('fs');
var sys = require('sys');
require('./underscore/underscore');

var b = exports;



getMap = {};
postMap = {};

b.setStaticPath = function(prefix, path){
  fs.stat(prefix + path,function(err,stats){
    if(stats.isDirectory()){
      fs.readdir(prefix+path,function(err,files){
        _.each(files, function(file){
          b.setStaticPath(prefix, path+'/'+file);
        });
      });
    } else if(stats.isFile()){
      getMap[path] = b.sendFile(prefix+path);
    } else {
      sys.puts('ERROR: Path: '+prefix+path+' is not a valid file or directory!');
    }
  });
};

b.get = function(path, handler){
  getMap[path] = handler;
};

b.post = function(path, handler){
  postMap[path] = handler;
};

function notFound(req, res){
  var NOT_FOUND = 'Not Found\n';
  sys.puts('404 ERROR');
  res.sendHTML(NOT_FOUND, 404);
}

var server = CS(function(req, res){
  res.sendHTML = function(body, code){
    code = code || 200;
    header = [['Content-Type', 'text/html; charset=utf-8']
            ,['Content-Length', body.length]];
    this.writeHead(code, header);
    this.write(unescape(body));
    this.end();
  };
  // Currently, if the request is GET, then only header is mostly
  // relevant. If the request is POST, then the body may be relevant
  // However, in most cases, you only need to scrap the form submision
  // things, therefore, it will be availiable in param as needed, 
  // However, body of the request will be availible in req.body
  if(req.method === 'GET'){
    var handled = false;
    if(!handler){
      _.each(_.keys(getMap), function(key){
        var args = new RegExp(key).exec(req.url);
        if(args){
          args.shift();
          args.unshift(req, res);
          handled = true;
          getMap[key].apply(this, args);
          _.breakLoop();
        }
      });
    }
    if(!handled) notFound(req, res);
  } else if(req.method === 'POST'){
    var handler = postMap[req.url] || notFound;
	req.body = '';
    req.addListener('data', function(chunk){sys.puts("chunk = " + chunk);req.body = chunk;});
    req.addListener('end', function(){
      var info = /([^=&]+)=([^&]+)/ig;
	  var match;
      
      req.params = req.params || {};
      while((match = info.exec(req.body)) != null){
		sys.puts("puts: post vars = " + match[1] + " = " + match[2] )
        req.params[match[1]] = match[2];
      }
      handler(req, res);
    });
  }
});

b.getPostParams = function(req, callback){
  var body = '';
  req.addListener('body', function(chunk){body += chunk;})
     .addListener('complete', function(){
       callback(unescape(body.substring(8).replace(/\+/g,' ')));
     });
}

b.listen = function(port, host){
  server.listen(port, host);
  sys.puts('Server at http://' + (host || '127.0.0.1') + ':' + port.toString() + '/');
}

function extname(path){
  var index = path.lastIndexOf('.');
  return index < 0 ? '' : path.substring(index);
}

b.sendFile = function(filename){
  var body, headers;
  var content_type = b.mime.lookupExtension(extname(filename));
  function loadResponseData(callback){
    if(body && headers){
      callback();
      return;
    }
    sys.puts("Loading " + filename + '...');
    var file = fs.readFile(filename, 'utf8',function(err,data){
	  if(err){
	    sys.puts('Error ' + err + ' while loading ' + filename);
	  }
      body = data;
      headers = [['Content-Type', content_type]
      ,['Content-Length', data.length]];
      sys.puts('static file' + filename + ' loaded');
      callback();
    });
  }
  return function(req, res){
    loadResponseData(function(){
      res.writeHead(200, headers);
      res.write(body);
      res.end();
    });
  }
};

// stolen from jack- thanks
b.mime = {
  // returns MIME type for extension, or fallback, or octet-steam
  lookupExtension : function(ext, fallback) {
    return b.mime.TYPES[ext.toLowerCase()] || fallback || 'application/octet-stream';
  },

  // List of most common mime-types, stolen from Rack.
  TYPES : { ".3gp"   : "video/3gpp"
  , ".a"     : "application/octet-stream"
  , ".ai"    : "application/postscript"
  , ".aif"   : "audio/x-aiff"
  , ".aiff"  : "audio/x-aiff"
  , ".asc"   : "application/pgp-signature"
  , ".asf"   : "video/x-ms-asf"
  , ".asm"   : "text/x-asm"
  , ".asx"   : "video/x-ms-asf"
  , ".atom"  : "application/atom+xml"
  , ".au"    : "audio/basic"
  , ".avi"   : "video/x-msvideo"
  , ".bat"   : "application/x-msdownload"
  , ".bin"   : "application/octet-stream"
  , ".bmp"   : "image/bmp"
  , ".bz2"   : "application/x-bzip2"
  , ".c"     : "text/x-c"
  , ".cab"   : "application/vnd.ms-cab-compressed"
  , ".cc"    : "text/x-c"
  , ".chm"   : "application/vnd.ms-htmlhelp"
  , ".class"   : "application/octet-stream"
  , ".com"   : "application/x-msdownload"
  , ".conf"  : "text/plain"
  , ".cpp"   : "text/x-c"
  , ".crt"   : "application/x-x509-ca-cert"
  , ".css"   : "text/css"
  , ".csv"   : "text/csv"
  , ".cxx"   : "text/x-c"
  , ".deb"   : "application/x-debian-package"
  , ".der"   : "application/x-x509-ca-cert"
  , ".diff"  : "text/x-diff"
  , ".djv"   : "image/vnd.djvu"
  , ".djvu"  : "image/vnd.djvu"
  , ".dll"   : "application/x-msdownload"
  , ".dmg"   : "application/octet-stream"
  , ".doc"   : "application/msword"
  , ".dot"   : "application/msword"
  , ".dtd"   : "application/xml-dtd"
  , ".dvi"   : "application/x-dvi"
  , ".ear"   : "application/java-archive"
  , ".eml"   : "message/rfc822"
  , ".eps"   : "application/postscript"
  , ".exe"   : "application/x-msdownload"
  , ".f"     : "text/x-fortran"
  , ".f77"   : "text/x-fortran"
  , ".f90"   : "text/x-fortran"
  , ".flv"   : "video/x-flv"
  , ".for"   : "text/x-fortran"
  , ".gem"   : "application/octet-stream"
  , ".gemspec" : "text/x-script.ruby"
  , ".gif"   : "image/gif"
  , ".gz"    : "application/x-gzip"
  , ".h"     : "text/x-c"
  , ".hh"    : "text/x-c"
  , ".htm"   : "text/html"
  , ".html"  : "text/html"
  , ".ico"   : "image/vnd.microsoft.icon"
  , ".ics"   : "text/calendar"
  , ".ifb"   : "text/calendar"
  , ".iso"   : "application/octet-stream"
  , ".jar"   : "application/java-archive"
  , ".java"  : "text/x-java-source"
  , ".jnlp"  : "application/x-java-jnlp-file"
  , ".jpeg"  : "image/jpeg"
  , ".jpg"   : "image/jpeg"
  , ".js"    : "application/javascript"
  , ".json"  : "application/json"
  , ".log"   : "text/plain"
  , ".m3u"   : "audio/x-mpegurl"
  , ".m4v"   : "video/mp4"
  , ".man"   : "text/troff"
  , ".mathml"  : "application/mathml+xml"
  , ".mbox"  : "application/mbox"
  , ".mdoc"  : "text/troff"
  , ".me"    : "text/troff"
  , ".mid"   : "audio/midi"
  , ".midi"  : "audio/midi"
  , ".mime"  : "message/rfc822"
  , ".mml"   : "application/mathml+xml"
  , ".mng"   : "video/x-mng"
  , ".mov"   : "video/quicktime"
  , ".mp3"   : "audio/mpeg"
  , ".mp4"   : "video/mp4"
  , ".mp4v"  : "video/mp4"
  , ".mpeg"  : "video/mpeg"
  , ".mpg"   : "video/mpeg"
  , ".ms"    : "text/troff"
  , ".msi"   : "application/x-msdownload"
  , ".odp"   : "application/vnd.oasis.opendocument.presentation"
  , ".ods"   : "application/vnd.oasis.opendocument.spreadsheet"
  , ".odt"   : "application/vnd.oasis.opendocument.text"
  , ".ogg"   : "application/ogg"
  , ".p"     : "text/x-pascal"
  , ".pas"   : "text/x-pascal"
  , ".pbm"   : "image/x-portable-bitmap"
  , ".pdf"   : "application/pdf"
  , ".pem"   : "application/x-x509-ca-cert"
  , ".pgm"   : "image/x-portable-graymap"
  , ".pgp"   : "application/pgp-encrypted"
  , ".pkg"   : "application/octet-stream"
  , ".pl"    : "text/x-script.perl"
  , ".pm"    : "text/x-script.perl-module"
  , ".png"   : "image/png"
  , ".pnm"   : "image/x-portable-anymap"
  , ".ppm"   : "image/x-portable-pixmap"
  , ".pps"   : "application/vnd.ms-powerpoint"
  , ".ppt"   : "application/vnd.ms-powerpoint"
  , ".ps"    : "application/postscript"
  , ".psd"   : "image/vnd.adobe.photoshop"
  , ".py"    : "text/x-script.python"
  , ".qt"    : "video/quicktime"
  , ".ra"    : "audio/x-pn-realaudio"
  , ".rake"  : "text/x-script.ruby"
  , ".ram"   : "audio/x-pn-realaudio"
  , ".rar"   : "application/x-rar-compressed"
  , ".rb"    : "text/x-script.ruby"
  , ".rdf"   : "application/rdf+xml"
  , ".roff"  : "text/troff"
  , ".rpm"   : "application/x-redhat-package-manager"
  , ".rss"   : "application/rss+xml"
  , ".rtf"   : "application/rtf"
  , ".ru"    : "text/x-script.ruby"
  , ".s"     : "text/x-asm"
  , ".sgm"   : "text/sgml"
  , ".sgml"  : "text/sgml"
  , ".sh"    : "application/x-sh"
  , ".sig"   : "application/pgp-signature"
  , ".snd"   : "audio/basic"
  , ".so"    : "application/octet-stream"
  , ".svg"   : "image/svg+xml"
  , ".svgz"  : "image/svg+xml"
  , ".swf"   : "application/x-shockwave-flash"
  , ".t"     : "text/troff"
  , ".tar"   : "application/x-tar"
  , ".tbz"   : "application/x-bzip-compressed-tar"
  , ".tcl"   : "application/x-tcl"
  , ".tex"   : "application/x-tex"
  , ".texi"  : "application/x-texinfo"
  , ".texinfo" : "application/x-texinfo"
  , ".text"  : "text/plain"
  , ".tif"   : "image/tiff"
  , ".tiff"  : "image/tiff"
  , ".torrent" : "application/x-bittorrent"
  , ".tr"    : "text/troff"
  , ".txt"   : "text/plain"
  , ".vcf"   : "text/x-vcard"
  , ".vcs"   : "text/x-vcalendar"
  , ".vrml"  : "model/vrml"
  , ".war"   : "application/java-archive"
  , ".wav"   : "audio/x-wav"
  , ".wma"   : "audio/x-ms-wma"
  , ".wmv"   : "video/x-ms-wmv"
  , ".wmx"   : "video/x-ms-wmx"
  , ".wrl"   : "model/vrml"
  , ".wsdl"  : "application/wsdl+xml"
  , ".xbm"   : "image/x-xbitmap"
  , ".xhtml"   : "application/xhtml+xml"
  , ".xls"   : "application/vnd.ms-excel"
  , ".xml"   : "application/xml"
  , ".xpm"   : "image/x-xpixmap"
  , ".xsl"   : "application/xml"
  , ".xslt"  : "application/xslt+xml"
  , ".yaml"  : "text/yaml"
  , ".yml"   : "text/yaml"
  , ".zip"   : "application/zip"
}
    };

