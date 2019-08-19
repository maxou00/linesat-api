var router=require('express').Router();
var bManager=require('../../db/bouquetsManager')();
var loginManager=require('../../db/loginManager')();
let userType=require('../../lib/constants').UserType;

let PermissionManager = require('../../lib/PermissionManager');

router.all(/^\/(.*)/, (req,resp,next)=>{
    console.log(req.user);
    console.log(req.roles);

    if(req.user){
        next();
    }else{
        resp.status(403).json({success:false,message:"You're not logged in."});
    }
})

router.get('/',(req,res)=>{

    if(!PermissionManager.canReadBouquets(req.roles.grantLevel)){
        resp.status(400).json("Not enough permission");
        return;
    }

    bManager.readAll(req.dbSession)
    .then((result) => {
        res.json({
            success:true,
            result:result
        });
    }).catch((err) => {
        console.log(err);
        res.json({
            success:false,
            errors:[
                err
            ]
        })
    });
})

router.put('/',(req,resp)=>{
    if(req.isSystem){ 
        if(! PermissionManager.canCreateBouquet(req.roles.grantLevel)){
            resp.status(400).json("Not enough permission");
            return;
        }
        /// TODO: check if the user has sufficient rights to create a bouquet
        bManager.create(req.dbSession,req.body)
        .then((result) => {
            console.log(result);
            resp.status(200).json({
                success:true,
                message:"Content created"
            });
        }).catch((err) => {
            console.log(err);
            resp.status(304).json({
                success:false,
                message:"An error occured."
            });
        });
    }else{
        resp.status(403).json("You can't do that");
    }
})

router.patch('/:id',(req,resp)=>{
    if(req.params.id && req.isSystem){
        if(! PermissionManager.canCreateBouquet(req.roles.grantLevel)){
            resp.status(400).json("Not enough permission");
            return;
        }

        bManager.patch(req.dbSession,req.params.id,req.body)
        .then(()=>{
            resp.json({success:true});
        })
        .catch((err)=>{
            console.log(err);
            resp.status(403).json({success:false});
        })
    }
})

router.options('/:id',(req,resp)=>{
    console.log(req.body);

    if(req.params.id && req.isSystem && req.body.option){
        if(! PermissionManager.canLockBouquet(req.roles.grantLevel)){
            resp.status(400).json("Not enough permission");
            return;
        }

        let opt=req.body.option;
        if(opt==='lock'){
            bManager.lock(req.dbSession,req.params.id)
            .then(()=>{
                resp.json({success:true});
            })
            .catch((err)=>{
                console.log(err);
                resp.status(403).json({success:false});
            })
        }else if(opt==='activate'){
            bManager.activate(req.dbSession,req.params.id)
            .then(()=>{
                resp.json({success:true});
            })
            .catch((err)=>{
                console.log(err);
                resp.status(403).json({success:false});
            })
        }else{
            resp.status(403).json({success:false});
        }
    }
})

router.delete('/:id',(req,resp)=>{
    if(req.params.id && req.isSystem){
        if(! PermissionManager.canDeleteBouquet(req.roles.grantLevel)){
            resp.status(400).json("Not enough permission");
            return;
        }

        bManager.delete(req.dbSession,req.params.id)
        .then(()=>{
            resp.json({success:true});
        })
        .catch((err)=>{
            console.log(err);
            resp.status(403).json({success:false});
        })
    }
})

router.all((req,resp)=>{
    resp.status(404).json("invalid route");
})

module.exports=router;