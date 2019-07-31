var clientManager=require('../../db/clientsManager');
var router=require('express').Router();
var enums=require('../../db/constants');
router.all(/^(.*)$/,(req,resp,next)=>{
    if(req.mobileActive || req.session.uid){
        next();
    }else{  
        resp.status(403).json({
            success:false,
            message:'You are not logged in.'
        })
        req.dbSession.close();
    }
})

router.get('/',(req,res)=>{
    if(req.mobileActive && req.mobileSession.data.uid){
        clientManager().readByRef(req.dbSession,req.mobileSession.data.uid)
        .then((customer)=>{
            res.json({success:true,result:customer});
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).json({sucess:false});
        })
    }else if(req.session.userType==enums.UserType.SYSTEM){
        clientManager().readAll(req.dbSession)
        .then((result) => {
            res.json({
                success:true,
                result:result
            });
        }).catch((err) => {
            res.json({
                success:false,
                error:err
            })
        });
    }else{
        res.json({
            success:false,
            message:'Unauthorized Access'
        })
    }
    req.dbSession.close();
})

router.put('/',(req,res)=>{
    console.log(req.body);
    clientManager().create(req.dbSession,req.body)
        .then((result) => {
            res.json(
                {
                    success:true,
                    message:"Customer Created."
                }
            );
        }).catch((err) => {
            res.json({
                success:false,
                message:"An error occured."
            });
    });
    req.dbSession.close();
})

router.patch('/',(req,res)=>{
    console.log(req.body);
    if(req.mobileActive && req.mobileSession.data.uid){
        clientManager().patch(req.dbSession,req.mobileSession.data.uid,req.body)
        .then((rs)=>{
            res.json(
                {
                    success:true,
                    message:"Customer updated."
                }
            );
        })
        .catch((err)=>{
            console.log(err);
            res.status(401).json({success:false,errors:err})
        })
    }else{
        res.status(403).json({success:false});
    }
    req.dbSession.close();
})

module.exports=router;