var express=require('express');
var compteManager=require('../../db/comptesManager')();
var clientManager = require('../../db/clientsManager')();
var loginManager=require('../../db/loginManager')();
var agencyManager=require('../../db/agencesManager')();

var constants= require("../../db/constants");

var crypto=require('crypto');
var router=express.Router();

router.all(/^\/(.*)/, (req,resp,next)=>{

  if(req.user){
    next();
  }else{
    resp.status(403).json({success:false,message:"You're not logged in."});
  }
}) 

router.get('/business',(req,res)=>{
  if(req.isSystem){
    compteManager.readBusinessAccounts(req.dbSession)
    .then((docs)=>{
      res.json({success:true,result:docs});
    })
    .catch((err)=>{
      res.status(403).json({success:false});
    })
  }
  else{
    res.status(400).json({success:false});
  }
})

router.get('/customers',(req,res)=>{
  if(req.isSystem){
    compteManager.readCustomersAccount(req.dbSession)
    .then((docs)=>{
      res.json({success:true,result:docs});
    })
    .catch((err)=>{
      res.status(403).json({success:false});
    })
  }
  else{
    res.status(400).json({success:false});
  }
})

router.get('/',(req,res)=>{
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
      res.json({success:true,result:_accounts});
    })
  }
  // Send back to agency its customers accounts
  else if(req.isAgency){ //// TODO: Add role validation
    let docs=[];
    compteManager.readClientAccountsForAgency(req.dbSession,req.user.agency)
    .then((dcs)=>{
      docs=dcs;
      return req.dbSession.close();
    })
    .then(_=>{
      res.json({success:true,result:docs});
    })
    .catch((err)=>{
      res.status(403).json({success:false});
   })
  }
  else{
    res.status(400).json({success:false,message:"Invalid Request"});
  }
})  

router.put('/',(req,resp)=>{
  if(req.isAgency){
    compteManager().createCustomerAccount(req.dbSession,req.user.agency,req.body) /// TODO: Add role validation
    .then((_)=>{
      resp.json({success:true,message:"Ok Done."});
    })
    .catch((err)=>{
      resp.status(403).json({success:false,message:"Account not created."});
    })
  }else{
    resp.status(403).json({success:false});
  }
})

router.patch('/:accountid',(req,res)=>{
  if(req.isAgency){
    compteManager().updateCustomerAccount(req.dbSession,req.params.accountid,req.body)
    .then((rs)=>{
      res.json({success:true,message:"Update Done"})
    })
  }else{
    res.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

router.options('/:accountid/freeze',(req,res)=>{
  if(req.isAgency || req.isCustomer){
    compteManager().freezeAccount(req.dbSession,req.params.accountid)
    .then((rs)=>{
      res.json({success:true,message:"Freezed"})
    })
  }else{
    res.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

router.options('/:accountid/unfreeze',(req,res)=>{
  if(req.isAgency || req.isCustomer){
    compteManager().unFreezeAccount(req.dbSession,req.params.accountid)
    .then((rs)=>{
      res.json({success:true,message:"Unfreezed"})
    })
  }else{
    res.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

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

router.options('/:accountid/credit',(req,res)=>{
  console.log(req.params);
  if(req.isAgency){
    compteManager().creditCustomerAccount(req.dbSession,req.params.accountid,req.body.amount)
    .then((rs)=>{
      res.json({success:true,message:"Account credited"})
    })
    .catch((err)=>{
      res.status(403).json({success:false});
    })
  }else{
    res.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

module.exports=router;