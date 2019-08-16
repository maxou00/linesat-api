var router = require('express').Router();
var sysManager = require('../../db/sysAdminsManager')();

router.all(/^\/(.*)/,(req,res,next)=>{
    if(req.isSystem){
        next();
    }
    else{
        res.status(401).json({success:false});
    }
})

router.get('/users',(req,res)=>{
    sysManager.readAll(req.dbSession)
    .then((users)=>{
        res.json({success:true,users:users});
    })
    .catch((err)=>{
        res.status(403).json({success:false});
    })
})

module.exports=router;