var createError = require('http-errors');
var express = require('express');
var path = require('path');
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


/*

let ioredis= redis.createClient({port:6379,host:'localhost'});


ioredis.on("error",(err)=>{
  console.log(err);
})



/// contains the list of currently active users
let ioUsers=[];

/**
 * 
 * @param {{}} data 
 * @param {String} socketId 
 * Generate an object containing the socketID associated to this user and its previously stored user id  (UID)
 */

 /*
function ioUser(data={},socketId=''){
  return {
    socket:socketId,
    data:data
  }
}

/// Registering a middleware for user authentication
io.use((socket,next)=>{
  let query= socket.handshake.query;
  let token = query.token;
  let type= query.type;
  let key = '';

  if(token && type && (type==='agency' || type==="customer" || type==="system")){

    if(type === "customer"){
      key=`mobileSession${token}`;
    }

    ioredis.get(key,(str)=>{
      if(str){
        let parsed= JSON.parse(str);
        let data={
          type:type,
          uid:parsed.uid
        }
        ioUsers.push(ioUser(data,socket.id));
        next();
      }else{
        next("You are not connected");
      }
    })
 
  }else{
    next("You are not authenticated");
  }
})


///Defines 
const IOEvents={
  ACCOUNT_CREATED:'ACCOUNT_CREATED',
  ACCOUNT_DEBITED:'ACCOUNT_DEBITED',
  ACCOUNT_CREDITED:'ACCOUNT_CREDITED',
  SUBSCRIPTION_SUBMITTED:'SUBSCRIPTION_SUBMITTED',
  SUBCRIPTION_DONE:'SUBSCRIPTION_DONE',
  SUBSCRIPTION_ABORTED:'SUBSCRIPTION_ABORTED'
}

var namespace= io.on("connection",(socket)=>{
  console.log("Emission done");
  socket.on("confirm",(data)=>{
    console.log(data);
    socket.emit("sent",{hello:'received'});
  })

})
*/
module.exports = {
  app:app,
  server:server
};
