var express=require('express');
var clientManager=require('../../db/clientsManager');
var router=express.Router();

router.get('/',(req,res)=>{
    clientManager.readAll()
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