const redisClient = require('redis').createClient({host:'localhost',port:6379})
redisClient.on('error',(err)=>{
    console.log(err);
})

redisClient.on('connect',(...args)=>{
    console.log(args);
    console.log('connected to redis');
})


module.exports=redisClient;