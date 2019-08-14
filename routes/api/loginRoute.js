let express=require("express");
let loginManager= require('../../db/loginManager')();
let agencyUserManager= require('../../db/agencyUserManager')();
let agencyManager= require('../../db/agencesManager')();
let handler=require('./customerHandler').MobileSession;
let router =express.Router();
let userType=require('../../db/constants').UserType;

let jwt = require('jsonwebtoken');

const PRIVATE_KEY="com.linetechnologie.linesat.api.there_Is-a-pie@2019-InTheSky";
const ISSUER="com.linetechnologie.linesat.api.authservice";

router.post('/sys/login',(req,resp)=>{
    console.log(req.session);
    loginManager.authSysAdmin(req.dbSession,req.body)
    .then((user) => {
        let data={
            uid:result['_id'],
            type:userType.SYSTEM
        }
        let token = jwt.sign(data,PRIVATE_KEY);
        resp.json({
            success:true,
            user:user,
            token:token
        })
    })
    .catch((err) => {
        resp.status(403).json({success:false,});
    })
})

router.post('/agency/login',(req,resp)=>{
    loginManager().authAgencyUser(req.dbSession,req.body)
    .then((result) => {
        let data={
            uid:result.user._id,
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

router.post('/customer/login',(req,resp)=>{
    if(req){
        console.log(req.body);
        loginManager().authCustomer(req.dbSession,req.body)
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