const mysqlx= require('@mysql/xdevapi');

const config={
    host:'localhost',
    port:33060,
    user:'linesat',
    password:'Linesat2019',
    database:'linesat'
}

const client =  mysqlx.getClient(config,{
    pooling:{
        enabled:true,
        maxSize:25,
        maxIdleTime:30000,
        queueTimeout:10000
    }
});

module.exports={
    config:config,
    client:client
};