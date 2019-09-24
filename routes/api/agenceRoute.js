var express=require('express');
var agenceManager=require('../../db/agencesManager')();
var userManager=require('../../db/agencyUserManager')();
var loginManager=require('../../db/loginManager')();
var accountManager = require('../../db/comptesManager')();
var constants = require('../../lib/constants');
var PM = require('../../lib/PermissionManager');
const SPM = PM.system;
const APM = PM.agency;

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
        resp.status(401).json({success:false,message:'Unauthorized access'});
        return;
    }

    //PASSED !!!
    // Check if user has enough privileges
    if(! SPM.canReadAgencies(req.roles.grantLevel)){
        resp.status(401).json({success:false,message:"Not enough permission"});
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

router.get("/account",(req,resp)=>{
    if(! req.isAgency){
        resp.status(401).json({success:false,message:'Unauthorized access'});
        return;
    }

    /// We check if the current Agency User have sufficient privileges to see the users list. //// _____ TO BE CORRECTED
    if(!APM.canReadTransactions(req.roles.grantLevel)){
        resp.status(401).json({success:false,message:"Not enough permission"});
        return;
    }

    accountManager.readAgencyAccountDetails(req.dbSession,req.user.agency)
    .then((result) => {
        resp.json({
            success:true,
            result:result
        });
    })
    .catch((err) => {
        resp.json({
            success:false,
            error:err
        })
    });
})

router.get("/activity",(req,resp)=>{
    if(! req.isAgency){
        resp.status(401).json({success:false,message:'Unauthorized access'});
        return;
    }

    /// We check if the current Agency User have sufficient privileges to see the users list. //// _____ TO BE CORRECTED
    if(!APM.canReadTransactions(req.roles.grantLevel)){
        resp.status(401).json({success:false,message:"Not enough permission"});
        return;
    }

    accountManager.readAgencyAccountDetails(req.dbSession,req.user.agency)
    .then((result) => {
        return accountManager.readActivityOfAccount(req.dbSession,result._id);
    })
    .then((rs)=>{
        console.log(rs);
        resp.json({
            success:true,
            result:rs
        });
    })
    .catch((err) => {
        resp.json({
            success:false,
            error:err
        })
    });
})

router.get('/users',(req,resp)=>{
    if(! req.isAgency){
        resp.status(401).json({success:false,message:'Unauthorized access'});
        return;
    }
    /// We check if the current Agency User have sufficient privileges to see the users list. //// _____ TO BE CORRECTED
    if(!APM.canReadUsers(req.roles.grantLevel)){
        resp.status(401).json({success:false,message:"Not enough permission"});
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
            error:err
        })
    });
})

router.put('/',(req,res)=>{
    if(! req.isSystem){
        resp.status(401).json({success:false,message:"Unauthorized access"});
        return;
    }

    if(! SPM.canCreateAgency(req.roles.grantLevel)){
        resp.status(400).json("Not enough permission");
        return;
    }

    agenceManager.create(req.dbSession,req.body)
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
    if(req.isAgency && APM.canCreateUser(req.roles.grantLevel)){
        userManager.createUser(req.dbSession,{user:req.body,agency:req.user.agency})
        .then((result) => {
            resp.json({
                success:true,
                message:'Agency User created'
            });
        })
        .catch((err) => {
            console.log(err);
            resp.status(403).json({
                success:false,
                errors:[
                    err
                ]
            })
        });
    }else{
        resp.status(401).json({success:false,message:"Not enough permission"});
    }
})

router.post('/user/:uid/credit',(req,resp)=>{
    /// We check if the current Agency User have sufficient privileges to see the users list.
    if(req.isAgency && APM.canCreateUser(req.roles.grantLevel)){
        userManager.compareAgencyOfUsers(req.dbSession,{userA:req.user.uid,userB:req.params.uid})
        .then((bool)=>{
            if(bool){
                userManager.creditUser(req.dbSession,req.params.uid)
                .then((result) => {
                    resp.json({
                        success:true,
                        message:'Agency User Access credited'
                    });
                })
                .catch((err) => {
                    console.log(err);
                    resp.status(403).json({
                        success:false,
                        errors:[
                            err
                        ]
                    })
                });
            }else{
                resp.status(401).json({success:false,message:'Access violation'});
            }
        })
        .catch((err) => {
            console.log(err);
            resp.status(403).json({
                success:false,
                errors:[
                    err
                ]
            })
        });
    }else{
        resp.status(401).json({success:false,message:"Not enough permission"});
    }
})


router.post('/user/:uid/discredit',(req,resp)=>{
    /// We check if the current Agency User have sufficient privileges to see the users list.
    if(req.isAgency && APM.canCreateUser(req.roles.grantLevel)){
        userManager.compareAgencyOfUsers(req.dbSession,{userA:req.user.uid,userB:req.params.uid})
        .then((bool)=>{
            if(bool){
                userManager.discreditUser(req.dbSession,req.params.uid)
                .then((result) => {
                    resp.json({
                        success:true,
                        message:'Agency User Access discredited'
                    });
                })
                .catch((err) => {
                    console.log(err);
                    resp.status(403).json({
                        success:false,
                        errors:[
                            err
                        ]
                    })
                });
            }else{
                resp.status(401).json({success:false,message:'Access violation'});
            }
        })
        .catch((err) => {
            console.log(err);
            resp.status(403).json({
                success:false,
                errors:[
                    err
                ]
            })
        });
    }else{
        resp.status(401).json({success:false,message:"Not enough permission"});
    }
})

router.patch('/:id',(req,res)=>{
    if(! req.agency){
        resp.status(401).json({success:false,message:"Unauthorized access"});
        return;
    }
    if(! APM.canUpdateAgencyProfile(req.roles.grantLevel)){
        resp.status(401).json({success:false,message:"Not enough permission"});
        return;
    }
    
    /// TODO : Check if the user is really a user of the given agency
    
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