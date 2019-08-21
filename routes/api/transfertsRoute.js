var express=require('express');
var clientManager=require('../../db/clientsManager')();
var accountManager=require('../../db/comptesManager')();

var router=express.Router();
var pm = require('../../lib/PermissionManager');
var APM=pm.agency;
var SPM = pm.system;

router.all((req,resp,next)=>{
    if(req.user){
        next();
    }else{
        resp.status(403).json({success:false});
    }
})

router.get('/',(req,resp)=>{
    let lvl = req.roles.grantLevel;
    if(req.isAgency){
        if( ! APM.canReadTransactions(lvl)){
            resp.status(401).json("Not enough privileges");
            return;
        }

        accountManager.readTransactionsOfAccount(req.dbSession,req.user.agency)
        .then((trans)=>{
            resp.json({success:true,transactions:trans});
        })
        .catch(err=>{
            console.log(err);
        })
    }
    else if(req.isSystem){

    }
    else{

    }
})

router.get('/account/:id',(req,res)=>{

    if(req.isCustomer){
        accountManager.checkIfAccountIsOwnedByCustomer(
            req.dbSession,
            req.params.id,
            req.user.uid
        )
        .then((bool)=>{
            if(bool)
            {
                return accountManager.readTransactionsOfAccount(req.dbSession,req.params.id);
            }
            else
            {
                res.status(403).json({success:false});
                req.dbSession.close();
            }
        })
        .then((trans)=>{
            console.log(trans);
            res.json({success:true,result:trans});
            req.dbSession.close();
        })
        .catch((err) => {
            console.log(err);
            res.status(403).json({
                success:false,
            })
            req.dbSession.close();
        });
    }else{
        req.status(403).json({success:false});
    }
    
})

module.exports=router;