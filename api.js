var api = require('express').Router();
const dbHandler=require('./routes/mysqlSessionMw');
const roleHandler = require('./routes/api/roleMiddleware');

var agenceRouter= require('./routes/api/agenceRoute');
var sysRouter=require('./routes/api/sysRoute'); 
var bouquetRouter=require('./routes/api/bouquetRoute');
var clientRouter=require('./routes/api/clientRoute');
var compteRouter=require('./routes/api/compteRoute');
var loginRouter=require('./routes/api/loginRoute');
var subscriptionRouter=require('./routes/api/subscriptionRoute');
var transfertRouter= require('./routes/api/transfertsRoute');

api.use(dbHandler); // middleware for db connection injection
api.use(roleHandler); // middleware set for reading user info and injecting its access level details.

api.use('/agencies',agenceRouter);
api.use('/auth',loginRouter);
api.use('/bouquets',bouquetRouter);
api.use('/customers',clientRouter);
api.use('/accounts',compteRouter);
api.use('/subscriptions',subscriptionRouter);
api.use('/transactions',transfertRouter);
api.use('/sys',sysRouter);

module.exports = api;
