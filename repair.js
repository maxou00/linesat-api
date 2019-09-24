const mysqlx = require('@mysql/xdevapi');
const config = require('./db/connection').config;
const crypto = require('crypto');
const HASH_ALG = require('./settings.json').defaultEncryption;
var accountManager = require('./db/comptesManager')();
var accountCodeGen = require("./lib/helpers");
const settings = require('./settings.json');

function createRootAdmin(session){
    let adminDoc = settings.initialAdmin;
    let credentials = adminDoc.credentials;
    return new Promise((resolve,reject)=>{
        let schema = session.getSchema(config.database);
        let sysadmins = schema.getCollection("sysadmins");

        credentials.passwordHash = crypto.createHash(HASH_ALG).update(adminDoc.credentials.password).digest('hex');

        delete credentials.password;

        adminDoc.credentials = credentials;

        console.log("Creating Initial Admin Account");
        sysadmins.add(adminDoc).execute()
        .then((rs)=>{
            console.log("Account Created.");
            resolve();
        })
    })
}

function createRootAccount(session){
    let rootAccount = settings.rootAccount;
    rootAccount.code =  accountCodeGen(16);
    return new Promise((resolve,reject)=>{
        let schema = session.getSchema(config.database);
        let accounts = schema.getCollection("accounts");

        console.log("Creating Initial ROOT Account");
        accounts.add(rootAccount).execute()
        .then((rs)=>{
            console.log("Account Created.");
            resolve();
        })
        .then(()=>{
            return accountManager.generateActivityForAccount(
                session,
                `${rootAccount._id}`,
                {
                    txnType:"PROVISION",
                    reason:"Provisionning",
                    balanceBefore: `${0} ${rootAccount.currency}`,
                    balanceAfter:`${rootAccount.amount} ${rootAccount.currency}`
                }
            )
        })
        .then(()=>{
            resolve();
        })
    })
}


function createBufferAccount(session){
    let bufferAccount = settings.bufferAccount;
    bufferAccount.code =  accountCodeGen(16);
    return new Promise((resolve,reject)=>{
        let schema = session.getSchema(config.database);
        let accounts = schema.getCollection("accounts");

        console.log("Creating Initial BUFFER Account");
        accounts.add(bufferAccount).execute()
        .then((rs)=>{
            console.log("Account Created.");
            resolve();
        })
    })
}

function __init__(){
    return new Promise((resolve,reject)=>{
        let session;
        mysqlx.getSession(config)
        .then((_s) => {
            session = _s;
        })
        .then((_)=>{
            return createRootAdmin(session);
        })
        .then((_)=>{
            return createRootAccount(session);
        })
        .then((_)=>{
            return createBufferAccount(session);
        })
        .then((_)=>{
            resolve();
        })
    });
}


function __destroy__(){
    return new Promise((resolve,reject)=>{
        let session;
        let schema;
        mysqlx.getSession(config)
        .then((_session) => {
            session = _session;
            schema = session.getSchema(config.database);
            return schema.getCollection("accountActivity").remove("_id != ''").execute();
        })
        .then(()=>{
            return schema.getCollection("accounts").remove("_id != ''").execute();
        })
        .then(()=>{
            return schema.getCollection("agencies").remove("_id != ''").execute();
        })
        .then(()=>{
            return schema.getCollection("agencyUsers").remove("_id != ''").execute();
        })
        .then(()=>{
            return;//schema.getCollection("bouquets").remove("_id != ''").execute();
        })
        .then(()=>{
            return ;//schema.getCollection("coupons").remove("_id != ''").execute();
        })
        .then(()=>{
            return schema.getCollection("customers").remove("_id != ''").execute();
        })
        .then(()=>{
            return schema.getCollection("subscriptions").remove("_id != ''").execute();
        })
        .then(()=>{
            return schema.getCollection("sysadmins").remove("_id != ''").execute();
        })
        .then(()=>{
            return schema.getCollection("transactions").remove("_id != ''").execute();
        })
        .then((_)=>{
            session.done();
        })
        .then(()=>{
            resolve();
            return;
        })
    });
}

function fun(){
    __destroy__()
    .then(()=>{
        return __init__();
    })
}

fun();