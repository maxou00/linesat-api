var router=require('express').Router();
var bManager=require('../../db/bouquetsManager');
var loginManager=require('../../db/loginManager');
let userType=require('../../db/constants').UserType;


router.all(/^\/(.*)/, (req,resp,next)=>{
    console.log('Bouquets Zone middleware');
    console.log(req.session);
    if(req.mobileActive || req.session.userType===userType.AGENCY || req.session.userType===userType.SYSTEM){
        console.log('unlocking...');
        next();
    }else{
        resp.status(403).json({success:false,message:"You're not logged in."});
    }
})

router.get('/',(req,res)=>{
    bManager().readAll(req.dbSession)
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

    if(req.session.uid && req.session.userType===userType.SYSTEM){ /// TODO: check if the user has sufficient right to create a bouquet
        bManager().create(req.dbSession,req.body)
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
    console.log(req.params.id);
    if(req.params.id && req.session.uid && req.session.userType===userType.SYSTEM){
        bManager().patch(req.dbSession,req.params.id,req.body)
        .then(()=>{
            resp.json({success:true});
        })
        .catch((err)=>{
            console.log(err);
            resp.status(403).json({success:false});
        })
    }
})

router.options('/:id/lock',(req,resp)=>{
    console.log(req.params.id && req.session.sysadminID);
    if(req.params.id && req.session.uid && req.session.userType===userType.SYSTEM){
        bManager().lock(req.dbSession,req.params.id)
        .then(()=>{
            resp.json({success:true});
        })
        .catch((err)=>{
            console.log(err);
            resp.status(403).json({success:false});
        })
    }
})

router.options('/:id/activate',(req,resp)=>{
    console.log(req.params.id && req.session.sysadminID);
    if(req.params.id && req.session.uid && req.session.userType===userType.SYSTEM){
        bManager().activate(req.dbSession,req.req.params.id)
        .then(()=>{
            resp.json({success:true});
        })
        .catch((err)=>{
            console.log(err);
            resp.status(403).json({success:false});
        })
    }
})

router.delete('/:id',(req,resp)=>{
    console.log(req.params.id && req.session.sysAdminID);
    if(req.params.id && req.session.uid && req.session.userType===userType.SYSTEM){
        bManager().delete(req.dbSession,req.params.id)
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