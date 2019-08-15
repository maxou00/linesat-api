var express=require('express');
var agenceManager=require('../../db/agencesManager')();
var userManager=require('../../db/agencyUserManager')();
var loginManager=require('../../db/loginManager')();

var constants = require('../../db/constants');

var router=express.Router();

router.all(/^\/(.*)/, (req,resp,next)=>{
    if(req.isSystem || req.isAgency){
        next();
    }else{
        resp.status(403).json({success:false,message:'Unauthorized access'})
    }
})

router.get('/',(req,res)=>{
    agenceManager.readAll(req.dbSession)
    .then((result) => {
        res.json({
            success:true,
            result:result
        });
    })
    .catch((err) => {
        res.json({
            success:false,
            errors:[
                err
            ]
        })
    });
})

router.get('/users',(req,resp)=>{
    if(req.isAgency){
        /// We check if the current Agency User have sufficient privileges to see the users list.
        if(req.roles.grants.includes(permissions.perm_lvl_three)){
            userManager.readUsersByAgency(req.dbSession,req.user.agency)
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
    agenceManager.create(req.dbSession,{user:req.body,agency:req.user.agency})
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
    /// We check if the current Agency User have sufficient privileges to see the users list.
    if(req.isAgency && req.roles.grants.includes(permissions.perm_lvl_three)){
        userManager.createUser(req.dbSession,{user:req.body,agency:req.user.agency})
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
    agenceManager.update(req.dbSession,req.params.id,req.body)
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