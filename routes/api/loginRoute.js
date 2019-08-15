let loginManager= require('../../db/loginManager')();
let agencyUserManager= require('../../db/agencyUserManager')();
let agencyManager= require('../../db/agencesManager')();
let sysAdManager = require('../../db/sysAdminsManager')();
let router =require("express").Router();
let userType=require('../../db/constants').UserType;

let jwt = require('jsonwebtoken');

const PRIVATE_KEY="com.linetechnologie.linesat.api.there_Is-a-pie@2019-InTheSky";
const ISSUER="com.linetechnologie.linesat.api.authservice";

router.post('/sys',(req,resp)=>{
    if(req.isSystem){
        sysAdManager.readByRef(req.user.uid)
        .then((sysUser)=>{
            resp.json({
                success:true,
                result:{
                    user:sysUser,
                    token:req.token
                }
            })
        })
        .catch((err) => {
            if(err) console.log(err);
            resp.status(403).json({success:false,});
        })
    }else{
        loginManager.authSysAdmin(req.dbSession,req.body)
        .then((user) => {
            let data={
                uid:user._id,
                type:userType.SYSTEM
            }
            let token = jwt.sign(data,PRIVATE_KEY);
            resp.json({
                success:true,
                result:{
                    user:user,
                    token:token
                }
            })
        })
        .catch((err) => {
            if(err) console.log(err);
            resp.status(403).json({success:false,});
        })
    }
})

router.post('/agency',(req,resp)=>{
    loginManager.authAgencyUser(req.dbSession,req.body)
    .then((result) => {
        let data={
            uid:result.user._id,
            agency:result.agency._id,
            type:userType.AGENCY
        }
        token = jwt.sign(data,PRIVATE_KEY);
        resp.json({
            success:true,
            result:result,
            token:token
        });
    })
    .catch((err) => {
        if(err) console.log(err);
        resp.status(403).json({success:false,});
    });
})

router.post('/customer',(req,resp)=>{
    if(req){
        console.log(req.body);
        loginManager.authCustomer(req.dbSession,req.body)
        .then((cust)=>{
            let data={
                uid:cust._id,
                type:userType.CUSTOMER
            }
            token = jwt.sign(data,PRIVATE_KEY);
            resp.json({
                success:true,
                user:cust,
                token:token
            });
        })
        .catch((err)=>{
            console.log(err);
            resp.status(403).json({success:false});
        })
    }
})

module.exports=router;