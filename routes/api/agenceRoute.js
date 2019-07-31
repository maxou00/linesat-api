var express=require('express');
var agenceManager=require('../../db/agencesManager');
var userManager=require('../../db/agencyUserManager');
var loginManager=require('../../db/loginManager');

var constants = require('../../db/constants');

var router=express.Router();

router.all(/^\/(.*)/, (req,resp,next)=>{
    if(req.session.userType===constants.UserType.SYSTEM){
        console.log("Unlocking access to agencies ");
        next();
    }else{
        resp.status(403).json({success:false,message:'Unauthorized access'})
    }
})

router.get('/',(req,res)=>{
    console.log(req.session);
    agenceManager().readAll(req.dbSession)
    .then((result) => {
        res.json({
            success:true,
            result:result
        });
    }).catch((err) => {
        res.json({
            success:false,
            errors:[
                err
            ]
        })
    });
})

router.get('/users',(req,resp)=>{
    if(req.session.agencyID && req.session.uid){
        let manager = userManager();

        /// We check if the current Agency User have sufficient privileges to see the users list.
        if(req.user_roles.grants.includes(permissions.perm_lvl_three)){
            manager.readUsersByAgency(req.dbSession,req.session.agencyID)
            .then((result) => {
                resp.json({
                    success:true,
                    result:result
                });
            })
            .catch((err) => {
                resp.json({
                    success:false,
                    errors:[
                        err
                    ]
                })
            });
        }else{
            resp.status(403).json({success:false,message:'You don\'t have enough grants to perform this action'})
        }
        
    }
})

router.put('/',(req,res)=>{
    agenceManager().create(req.dbSession,{user:req.body,agency:req.session.agencyID})
    .then((result) => {
        res.json({
            success:true,
        })
    }).catch((err) => {
        console.log(err);
        res.status(403).json({succes:false});
    });
})

router.put('/users',(req,resp)=>{
    let manager = userManager();
    /// We check if the current Agency User have sufficient privileges to see the users list.
    if(req.session.agencyID && req.session.uid && req.user_roles.grants.includes(permissions.perm_lvl_three)){
        manager.createUser(req.dbSession,{user:req.body,agency:req.session.agencyID})
        .then((result) => {
            resp.json({
                success:true,
                message:'Agency User created'
            });
        })
        .catch((err) => {
            console.log(err);
            resp.json({
                success:false,
                errors:[
                    err
                ]
            })
        });
    }else{
        resp.status(403).json({success:false,message:'You don\'t have enough grants to perform this action'})
    }
})


router.patch('/:id',(req,res)=>{
    agenceManager().update(req.dbSession,req.params.id,req.body)
    .then((result) => {
        console.log(result);
    }).catch((err) => {
        console.log(err);
    });
    console.log(req.body);
})

router.delete('/',(req,res)=>{
    console.log(req.body);
})

module.exports=router;