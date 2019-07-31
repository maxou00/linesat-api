var express=require('express');
var compteManager=require('../../db/comptesManager');
var clientManager = require('../../db/clientsManager');
var loginManager=require('../../db/loginManager');
var agencyManager=require('../../db/agencesManager')();
var crypto=require('crypto');
var router=express.Router();

router.all(/^\/(.*)/, (req,resp,next)=>{

  if( req.mobileActive || req.session.agencyID || req.session.sysAdminID ){
    next();
  }else{
    resp.status(403).json({success:false,message:"You're not logged in."});
  }
})

router.get('/',(req,res)=>{
  // Send back to customer its  accounts he created in agencies
  if(req.mobileActive && req.mobileSession.data.uid){
    let id= req.mobileSession.data.uid;
    let accounts=[]; // Save retrieved accounts;
    let agencies=[]; // Save agencies ID 
    /// READ CUSTOMER's Accounts
    compteManager().readAccountsWhereClientIs(req.dbSession,id)
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
  else if(req.session.agencyID){
    let docs=[];
    compteManager().readClientAccountsForAgency(req.dbSession,req.session.agencyID)
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
  }else if(req.session.sysAdminID){
    compteManager().readAll(req.dbSession)
    .then((docs)=>{
      res.json({success:true,result:docs});
    })
    .catch((err)=>{
      res.status(403).json({success:false});
    })
  }
  else{
    resp.status(403).json({success:false,message:"Invalid credentials"});
  }
})                                                                                                                                                                            

router.put('/',(req,resp)=>{
  console.log(req.body);
  if(req.session.agencyID){
    compteManager().createCustomerAccount(req.dbSession,req.session.agencyID,req.body)
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
  if(req.sessionID && req.session.agencyID){
    compteManager().updateCustomerAccount(req.dbSession,req.params.accountid,req.body)
    .then((rs)=>{
      res.json({success:true,message:"Update Done"})
    })
  }else{
    res.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

router.options('/:accountid/freeze',(req,res)=>{
  if(req.sessionID && req.session.agencyID){
    compteManager().freezeAccount(req.dbSession,req.params.accountid)
    .then((rs)=>{
      res.json({success:true,message:"Freezed"})
    })
  }else{
    res.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

router.options('/:accountid/unfreeze',(req,res)=>{
  if(req.sessionID && req.session.agencyID){
    compteManager().unFreezeAccount(req.dbSession,req.params.accountid)
    .then((rs)=>{
      res.json({success:true,message:"Unfreezed"})
    })
  }else{
    res.status(403).json({success:false,message:'You\'re not logged in'});
  }
})

router.options('/:accountid/debit',(req,res)=>{
  console.log(req.params);
  if(req.sessionID && req.session.agencyID){
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
  if(req.sessionID && req.session.agencyID){
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