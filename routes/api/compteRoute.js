var router=require('express').Router();
var compteManager=require('../../db/comptesManager')();
var clientManager = require('../../db/clientsManager')();
var loginManager=require('../../db/loginManager')();
var agencyManager=require('../../db/agencesManager')();
var couponManager = require('../../db/couponManager')();
var constants= require("../../lib/constants");
var crypto=require('crypto');

var pm = require('../../lib/PermissionManager');
const APM = pm.agency;
const SPM = pm.system;

router.all(/^\/(.*)/, (req,resp,next)=>{
  if(req.user){
    next();
  }else{
    resp.status(403).json({success:false,message:"You're not logged in."});
  }
}) 

router.get('/business',(req,resp)=>{
  if(req.isSystem){

    if(! SPM.canReadBusinessAccounts(req.roles.grantLevel)){
      resp.status(401).json({success:false,message:"Not enough permission"});
      return;
    }

    compteManager.readBusinessAccounts(req.dbSession)
    .then((docs)=>{
      resp.json({success:true,result:docs});
    })
    .catch((err)=>{
      resp.status(403).json({success:false});
    })
  }
  else{
    resp.status(400).json({success:false});
  }
})

router.get('/customers',(req,resp)=>{
  if(req.isSystem){
    if(! SPM.canReadCustomerAccounts(req.roles.grantLevel)){
      resp.status(401).json({success:false,message:"Not enough permission"});
      return;
    }
    compteManager.readCustomersAccount(req.dbSession)
    .then((docs)=>{
      console.log(docs);
      resp.json({success:true,result:docs});
    })
    .catch((err)=>{
      console.log(err);
      resp.status(403).json({success:false});
    })
  }
  else{
    resp.status(400).json({success:false});
  }
})

router.get('/',(req,resp)=>{
  // Send back to customer its  accounts he created in agencies
  if(req.isCustomer){
    let id= req.user.uid;
    let accounts=[]; // Save retrieved accounts;
    let agencies=[]; // Save agencies ID 
    /// READ CUSTOMER's Accounts
    compteManager.readAccountsWhereClientIs(req.dbSession,id)
    .then((accs)=>{
      console.log(accs);
      accounts=accs;
      //Extract agencies from accounts.
      accounts.forEach((acc,idx)=>{
        if(agencies.find((ag,id)=>ag===acc.agency)==undefined){ // Check if the agency already exists in agencies array and push if not.
          agencies.push(acc.agency);
        }
      })
      // Fetch These agencies docs 
      return Promise.all(agencies.map((ag,idx)=>agencyManager.readByRef(req.dbSession,ag)))
    })
    .then(agDocs=>{
      // Associate to each account its corresponding agency Doc
      return accounts.map((acc,idx)=>{
        let mapped={...acc};
        let cag=agDocs.find((ag,id)=>ag['_id']===mapped['agency']);
        mapped.agencyDetails=cag;
        return mapped;
      })
    })
    .then(_accounts=>{
      resp.json({success:true,result:_accounts});
    })
  }
  // Send back to agency its customers accounts
  else if(req.isAgency){ 
    if(! APM.canReadCustomerAccounts(req.roles.grantLevel)){
      resp.status(401).json({success:false,message:"Not enough permission"});
      return;
    }
    let docs=[];
    compteManager.readClientAccountsForAgency(req.dbSession,req.user.agency)
    .then((dcs)=>{
      docs=dcs;
      return req.dbSession.close();
    })
    .then(_=>{
      resp.json({success:true,result:docs});
    })
    .catch((err)=>{
      resp.status(403).json({success:false});
   })
  }
  else{
    resp.status(400).json({success:false,message:"Invalid Request"});
  }
})  

router.put('/',(req,resp)=>{
  if(req.isAgency){
    compteManager.createCustomerAccount(req.dbSession,req.user.agency,req.body) /// TODO: Add role validation
    .then((_)=>{
      resp.json({success:true,message:"Ok Done."});
    })
    .catch((err)=>{
      console.log(err);
      resp.status(403).json({success:false,message:"Account not created."});
    })
  }else{
    resp.status(403).json({success:false});
  }
})

/*router.patch('/:accountid',(req,res)=>{
  if(req.isAgency){
    compteManager().updateCustomerAccount(req.dbSession,req.params.accountid,req.body)
    .then((rs)=>{
      res.json({success:true,message:"Update Done"})
    })
  }else{
    res.status(403).json({success:false,message:'You\'re not logged in'});
  }
})
*/

router.post('/:accountid/freeze',(req,resp)=>{
  if(req.isCustomer){
    compteManager.freezeAccount(req.dbSession,req.params.accountid)
    .then((rs)=>{
      resp.json({success:true,message:"Freezed"})
    })
  }else{
    resp.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

router.post('/:accountid/unfreeze',(req,resp)=>{
  if(req.isCustomer){
    compteManager.unFreezeAccount(req.dbSession,req.params.accountid)
    .then((rs)=>{
      resp.json({success:true,message:"Unfreezed"})
    })
  }else{
    resp.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

/*
router.options('/:accountid/debit',(req,res)=>{
  //// TODO : UNSECURE FUNCTIONNALITY !!!!!
  console.log(req.params);
  if(req.isAgency || req.isCustomer){
    compteManager().debitCustomerAccount(req.dbSession,req.params.accountid,req.body.amount)
    .then((rs)=>{
      res.json({success:true,message:"Account debited"})
    })
    .catch((err)=>{
      res.status(403).json({success:false});
    })
  }else{
    res.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

*/

router.post('/:accountid/credit',(req,resp)=>{
  console.log(req.params);
  console.log(req.body);
  if(req.isAgency){
    if(! APM.canCreditCustomerAccount(req.roles.grantLevel)){
      resp.status(401).json({success:false,message:"Not enough permission"});
      return;
    }

    compteManager.checkIfIsAgencyOfAccount(req.dbSession,req.user.agency,req.params.accountid)
    .then((bool)=>{
      if(bool){
        return compteManager.creditCustomerAccount(req.dbSession,req.params.accountid,req.body.amount,req.body.reason);
      }else{
        throw new Error("You're not the agency of that account");
      }
    })
    .then((rs)=>{
      resp.json({success:true,message:"Account credited"})
    })
    .catch((err)=>{
      console.log(err);
      resp.status(403).json({success:false});
    })
  }else{
    resp.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

router.get('/:accountid/activity',(req,resp)=>{
  if(req.isAgency){
    let lvl = req.roles.grantLevel;
    if(! APM.canReadTransactions(lvl)){
      resp.status(401).json({success:false,message:'Unauthorized access'});
    }

    compteManager.checkIfAccountIsOwnedByAgency(req.dbSession,req.params.accountid,req.user.agency)
    .then((bool)=>{
      if(bool){
        return compteManager.readActivityOfAccount(req.dbSession,req.params.accountid);
      }
      else{
        resp.status(401).json({success:false,message:"You don't have any rights on this account"});
      }
    })
    .then((activities)=>{
      if(activities){
        resp.json({success:true,result:activities});
      }
    })
    .catch((err)=>{
      resp.status(400).json({success:false,message:'Bad request'});
    })
  }
  else if (req.isSystem){
    let lvl = req.roles.grantLevel;
    if(! SPM.canReadTransactions(lvl)){
      resp.status(401).json({success:false,message:'Bad request'});
    }

    compteManager.readActivityOfAccount(req.dbSession,req.params.accountid)
    .then((act)=>{
      resp.json({success:true,result:act});
    })
    .catch((err)=>{
      resp.status(400).json({success:false,message:'Bad request'});
    })
  }
  else if(req.isCustomer){
    compteManager.checkIfAccountIsOwnedByCustomer(req.dbSession,req.params.accountid,req.user.uid)
    .then((bool)=>{
      if(bool){
        return compteManager.readActivityOfAccount(req.dbSession,req.params.accountid);
      }
      else{
        resp.status(401).json({success:false,message:"You don't have any rights on this account"});
      }
    })
    .then((activities)=>{
      if(activities){
        resp.json({success:true,result:activities});
      }
    })
    .catch((err)=>{
      resp.status(400).json({success:false,message:'Bad request'});
    })
  }
  else{
    resp.status(400).json({success:false,message:'Bad request'});
  }
})

router.get('/:accountid/coupons',(req,resp)=>{
  if(req.isCustomer){
    compteManager.checkIfAccountIsOwnedByCustomer(req.dbSession,req.params.accountid,req.user.uid)
    .then((bool)=>{
      if(!bool){
        throw new Error("Access Violation");
      }
      console.log(req.params.accountid);
      return couponManager.readCouponInitiatedFromAccount(req.dbSession,req.params.accountid);
    })
    .then((coupons)=>{
      console.log(coupons);
      if(coupons){
        resp.json({success:true,coupons:coupons});
      }
    })
    .catch((err)=>{
      resp.status(400).json({success:false,message:'Bad request'});
    })
  }
  else{
    resp.status(400).json({success:false,message:'Bad request'});
  }
})

router.put('/:accountid/coupons',(req,resp)=>{
	console.log(req.body,req.params,req.user)
  if(req.isCustomer){
    compteManager.checkIfAccountIsOwnedByCustomer(req.dbSession,req.params.accountid,req.user.uid)
    .then((bool)=>{
      if(bool){
        let body = req.body;
        return couponManager.create(req.dbSession,{accountRef:req.params.accountid,amount:body.amount});
      }
      else{
        resp.status(401).json({success:false,message:"You don't have any rights on this account"});
      }
    })
    .then((rs)=>{
      if(rs){
        resp.json({success:true,result:rs});
      }
    })
    .catch((err)=>{
			console.log(err);
      resp.status(400).json({success:false,message:'Bad request'});
    })
  }
  else{
    resp.status(400).json({success:false,message:'Bad request'});
  }
})


router.get("/:accountid/coupons/:couponid/pin",(req,res)=>{
  if(! req.isCustomer){
    resp.status(400).json({success:false,message:'Bad request'});
    return;
  }
  Promise.all([
    compteManager.checkIfAccountIsOwnedByCustomer(req.dbSession,req.params.accountid,req.user.uid),
    couponManager.isCouponEmittedFromAccount(session,req.params.accountid,req.params.couponid)
  ])
  
  .then(([isOwner,isEmitter])=>{
    if(isOwner && isEmitter){
      return couponManager.getPinOfCoupon(req.dbSession,req.params.couponid);
    }
    else{
      throw new Error("You don't have any rights on this account and this coupon.");
    }
  })
  .then((rs)=>{
    if(rs){
      resp.json({success:true,coupon:req.params.couponid,pin:rs});
    }
  })
  .catch((err)=>{
    console.log(err);
    resp.status(400).json({success:false,message:'Bad request'});
  })

})

module.exports=router;
