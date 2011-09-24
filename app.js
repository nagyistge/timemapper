var express = require('express');
var dao = require('./dao.js');

var app = module.exports = express.createServer();

var indexName = 'hypernotes';

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set("view engine", "html");
  app.register(".html", require("jqtpl").express);
  app.set("jsonp callback");
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
  app.user(express.bodyParser());
});

// Routes
app.get('/', function(req, res){
  res.render('index.html', {
  });
});

app.get('/dashboard', function(req, res){
  res.render('dashboard.html', {
  });
});


// ======================================
// API
// ======================================

app.get('/api/v1/:objecttype/:id', function(req, res, next) {
  // klass = getattr(logic, objecttype.capitalize())
  // out = klass.get(req.params.id)
  dao.get(indexName, req.params.objecttype, req.params.id)
    .on('data', function(data) {
      var out = JSON.parse(data);
      if (!out.exists) {
        // next(new Error('Cannot find ' + req.params.objecttype + ' with id ' + req.params.id));
        var msg = 'Cannot find ' + req.params.objecttype + ' with id ' + req.params.id;
        res.send(msg, 404);
      } else {
        res.send(out._source);
      }
    })
    .exec();
});

var apiUpsert = function(req, res) {
    var data = req.body;
    if (req.params.id) {
      data.id = req.params.id;
    }
    dao.upsert(indexName, req.params.objecttype, data, function(outData) {
      res.send(outData)
    });
};

app.post('/api/v1/:objecttype', apiUpsert);
app.put('/api/v1/:objecttype/:id?', apiUpsert);
    
app.get('/api/v1/:objecttype', function(req,res) {
  q = req.params.q;
  qryObj = {
  }
  dao.search(indexName, req.params.objecttype, qryObj)
    .on('data', function(data) {
      var parsed = JSON.parse(data);
      var out = {
        'status': 'ok'
        , 'q': q
        , 'result': parsed.hits
      };
      res.send(out);
    })
    .exec()
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);