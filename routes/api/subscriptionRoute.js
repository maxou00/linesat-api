var express=require('express');
var clientManager=require('../../db/clientsManager')();
var subManager= require('../../db/subscriptionsManager')();
var accountManager=require('../../db/comptesManager')();
var router=express.Router();
var enums= require('../../lib/constants');
router.all((req,res,next)=>{
    if(req.user){
        next();
    }else{
        res.status(403).json({success:false,message:'You are not logged in'});
    }
})

router.get('/',(req,res)=>{
    if(req.isAgency){
        subManager.readSubscriptionsForAgency(req.dbSession,req.user.agency)
        .then((result) => {
            res.json({
                success:true,
                result:result
            });
        }).catch((err) => {
            res.json({
                success:false,
                errors:[
                    err
                ]
            })
        });
    }
})

router.get('/account/:aid',(req,res)=>{
    if(req.isCustomer){
        accountManager.checkIfAccountIsOwnedByCustomer(req.dbSession,req.params.aid,req.user.uid)
        .then((bool)=>{
            if(bool){
                return subManager.readSubscriptionsForCustomerByAccount(req.dbSession,req.params.aid);
            }else{
                resp.status(403).json({success:false});
                return;
            }
        })
        .then((accs)=>{
            res.json({success:true,result:accs});
            req.dbSession.close();
        })
        .catch(err=>{
            console.log(err);
            res.status(401).json({success:false});
            req.dbSession.close();
        })
    }else{
        res.status(401).json({success:false});
        req.dbSession.close();
    }
})

/*router.post('/',(req,res)=>{
    let body= req.body;
    console.log(req.query);
    switch(body.action){
        case "STORE":{
            clientManager.create(body.content)
            .then((result) => {
                console.log(result);
            }).catch((err) => {
                console.log(err);
            });
            break;
        }
        case "UPDATE":{
            clientManager.update(body.reference,body.content);
            break;
        }
    }
    res.send("Received POST Call");
})*/


router.put('/',(req,resp)=>{
    // Check if the connected user is a customer
    if(req.isCustomer){
        // Check if the given account is owned by the currently connected customer
        accountManager.checkIfAccountIsOwnedByCustomer(req.dbSession,req.body.account,req.user.uid)
        .then((check)=>{
            if(check){
                console.log("Account verified");
                console.log(req.body);
                subManager.createSubscription(req.dbSession,req.body)
                .then((id)=>{
                    resp.json({success:true,message:'Subscription  pushed'});
                })
                .catch(err=>{
                    resp.status(403).json({success:false});
                })
            }else{
                console.log("Account check error");
                resp.status(403).json({success:false,message:'The provided Account ain\'t yours.'});
                req.dbSession.close();
            }
        })
        .catch(err=>{
            console.log(err);
            resp.status(500).json({success:false});
            req.dbSession.close();
        })
    }else{
        resp.status(403).json({success:false,message:'You are not a customer'});
        req.dbSession.close();
    }
})


router.options('/:id',(req,resp)=>{
    if(req.isAgency){
        subManager.checkIfAgencyCanChangeStateOf(req.dbSession,req.user.agency,req.params.id)
        .then((bool)=>{
            if(bool){
                let sub=req.params.id;
                switch(req.body.option){
                    case "ongoing":{
                        return subManager.setOngoing(req.dbSession,sub)
                    }
                    case "aborted":{
                        return subManager.setAborted(req.dbSession,sub)
                    }
                    case "done":{
                        return subManager.setDone(req.dbSession,sub)
                    }
                    default:{
                        resp.status(400).json({sucess:false})
                        break;
                    }
                }
            }else{
                resp.status(403).json({success:false});
            }
        })
        .then((rs)=>{
            resp.json({success:true});
        })
        .then(()=>{
            req.dbSession.done();
        })
        .catch((err)=>{
            console.warn(err);
            resp.status(401).json({success:false});
            req.dbSession.done();
        })
    }
})
module.exports=router;