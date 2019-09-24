var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cors= require('cors');
var logger = require('morgan');
var redis = require("redis");
var redisClient=redis.createClient();
// Handling redis client error
redisClient.on('error',(err)=>{
  console.log("Redis error");
  console.log(err);
});

var authHandler= require('./routes/authenticationMw');
var api=require('./api');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());
app.use(authHandler); /// Handling token based authentication
app.use('/api',api);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = {
  app:app,
  server:server
};
