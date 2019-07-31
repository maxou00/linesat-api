var client = require('../db/connection');
var msx=require("@mysql/xdevapi");

function dbSessionHandler(req,resp,next){
    msx.getSession(client.config)
    .then((session)=>{
        req.dbSession=session;
        next();
    })
    .catch((err)=>{
        console.log(`Err while creating session.`);
        resp.status(500).json({success:false,message:'An internal error occurred'});
    })
}

module.exports=dbSessionHandler;