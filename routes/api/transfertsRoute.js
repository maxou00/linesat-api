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
        resp.status(401).json({success:false,message:"Not enough privileges"});
        return;
    }
})

router.get('/',(req,resp)=>{
    let lvl = req.roles.grantLevel;
    if(req.isAgency){
        if( ! APM.canReadTransactions(lvl)){
            resp.status(401).json({success:false,message:"Not enough privileges"});
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
        if( ! SPM.canReadTransactions(lvl)){
            resp.status(401).json({success:false,message:"Not enough privileges"});
            return;
        }

        accountManager.readRootAccountDetails(req.dbSession)
        .then((acc)=>{
            return accountManager.readTransactionsOfAccount(req.dbSession,acc._id);
        })
        .then((trans)=>{
            resp.json({success:true,transactions:trans});
        })
        .catch(err=>{
            console.log(err);
        })
    }
    else{
        resp.status(400).json({success:false});
        return;
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
        req.dbSession.close();
    }
    
})


router.put('/',(req,resp)=>{
    if(req.isAgency){
        let {to,amount,reason} = req.body;
        let ag_account;
        let dest_account;
        accountManager.readAgencyAccountDetails(req.dbSession,req.user.agency)
        .then((rs)=>{
            ag_account=rs;
            return accountManager.readAccountByCode(req.dbSession,to);
        })
        .then((rs)=>{
            dest_account=rs;
            return accountManager.transact(
                req.dbSession,
                {
                    from:ag_account._id,
                    to:dest_account._id,
                    amount:Number.parseFloat(`${amount}`),
                    reason:`${reason}`
                }
            );
        })
        .then((rs)=>{
            resp.json({success:true});
            req.dbSession.close();
        })
        .catch((err)=>{
            resp.json({success:false});
            req.dbSession.close();
        })
    }

    if(req.isCustomer){
        accountManager.checkIfAccountIsOwnedByCustomer(req.dbSession,req.body.from,req.user.uid)
        .then((bool)=>{
            if(bool){
                return ;
            }else {
                throw new Error("Account Is Not Yours");
            }
        })
        .then(()=>{
            let body = req.body;
            return accountManager.transact(req.dbSession,{from:body.from,to:body.to,amount:body.amount,reason:body.reason})
        })
        .then((_)=>{
            resp.json({success:true});
            req.dbSession.close();
        })
        .catch((err)=>{
            resp.status(401).json({success:false,message:err});
            req.dbSession.close();
        })
    }
})

module.exports=router;