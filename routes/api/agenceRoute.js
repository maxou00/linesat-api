var express=require('express');
var agenceManager=require('../../db/agencesManager')();
var userManager=require('../../db/agencyUserManager')();
var loginManager=require('../../db/loginManager')();
var constants = require('../../lib/constants');
var PermissionManager = require('../../lib/PermissionManager');

var router=express.Router();

router.all(/^\/(.*)/, (req,resp,next)=>{
    if(req.isSystem || req.isAgency){
        next();
    }else{
        resp.status(403).json({success:false,message:'Unauthorized access'})
    }
})

router.get('/',(req,res)=>{

    // Check if User is a system user
    if(! req.isSystem){
        resp.status(400).json({success:false,message:'Unauthorized access'});
        return;
    }
 
    //PASSED !!!
    // Check if user has enough privileges
    if(! PermissionManager.canReadAgencies(req.roles.grantLevel)){
        resp.status(400).json("Not enough permission");
        return;
    }

    ///PASSED !!!
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
    if(! req.isAgency){
        resp.status(401).json({success:false,message:'Unauthorized access'});
        return;
    }
    /// We check if the current Agency User have sufficient privileges to see the users list. //// _____ TO BE CORRECTED
    if(! PermissionManager.canReadAgencyUsers(req.roles.grantLevel)){
        resp.status(400).json("Not enough permission");
        return;
    }

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
})

router.put('/',(req,res)=>{
    if(! req.isSystem){
        resp.status(400).json("Access violation");
        return;
    }

    if(! PermissionManager.canCreateAgency(req.roles.grantLevel)){
        resp.status(400).json("Not enough permission");
        return;
    }

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


/// TODO : Rewrite this function

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

/// UNIMPLEMENTED !!!!
router.delete('/',(req,res)=>{
    console.log(req.body);
})

module.exports=router;