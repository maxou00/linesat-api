var clientManager=require('../../db/clientsManager')();
var router=require('express').Router();
var enums=require('../../db/constants');

router.get('/',(req,res)=>{
    if(req.isCustomer){
        clientManager.readByRef(req.dbSession,req.user.uid)
        .then((customer)=>{
            res.json({success:true,result:customer});
        })
        .catch((err)=>{
            console.log(err);
            res.status(500).json({sucess:false});
        })
    }else if(req.isSystem){
        clientManager.readAll(req.dbSession)
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

    if(!(req.isCustomer)){
        res.json({
            success:false,
            message:"You are not an agency."
        });
        return;
    }
    clientManager.create(req.dbSession,req.body)
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
    if(req.isCustomer){
        clientManager.patch(req.dbSession,req.user.uid,req.body)
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