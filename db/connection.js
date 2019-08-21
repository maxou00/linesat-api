const mysqlx= require('@mysql/xdevapi');

const config=require('../settings.json').database;

const client =  mysqlx.getClient(config.hostConfig,{
    pooling:config.pooling
});

module.exports={
    config:config.hostConfig,
    client:client
};