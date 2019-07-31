var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var redisClient=require('redis').createClient();
var session = require('express-session');
var redisStore= require('connect-redis')(session);

// Handling redis client error

redisClient.on('error',(err)=>{
  console.log("Redis error");
  console.log(err);
});

var api=require('./api');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(session(
  {
    secret:"LineSatHashingString",
    name:"linesatservice",
    resave:false,
    saveUninitialized:true,
    cookie:{secure:false},
    store:new redisStore({host:"localhost",port:6379,ttl:84600,client:redisClient})
  }
));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', indexRouter);
app.use('/api',api);
//app.use('/bouquets',bouquetsRouter);
//app.use('/agences',agencesRouter);
//app.use('/comptes',comptesRouter);
//app.use('/reabos',reaboRouter);

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

module.exports = app;
