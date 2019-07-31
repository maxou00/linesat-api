var express=require('express');
var clientManager=require('../../db/clientsManager')();
var accountManager=require('../../db/comptesManager')();

var router=express.Router();

router.all((req,resp,next)=>{
    if(req.mobileActive || req.session.agencyID || req.session.sysAdminID){
        next();
    }else{
        resp.status(403).json({success:false});
    }
})

router.get('/account/:id',(req,res)=>{

    if(req.mobileActive && req.mobileSession.data.uid){
        accountManager.checkIfAccountIsOwnedByCustomer(
            req.dbSession,
            req.params.id,
            req.mobileSession.data.uid
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

router.post('/',(req,res)=>{
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
})

module.exports=router;