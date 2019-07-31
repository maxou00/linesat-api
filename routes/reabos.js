var express = require('express');
var router = express.Router();
var loginManager=require('../db/loginManager');
var reaboManager=require('../db/reaboManager');

router.all(/^\/(.*)/, (req,resp,next)=>{
    let token =req.cookies.token;
    if(token){
        loginManager.readActiveUserByToken(token)
        .then((result) => {
            let user=result[0];
            if(user){
                req.user=user;
                next();
            }else{
                resp.redirect('/login');
            }
        }).catch((err) => {
            console.log(err);
            resp.redirect('/login');
        });
    }else{
        resp.redirect('/login');
    }
})

router.get('/',async(req,res)=>{
    reaboManager.readAll()
    .then((result) => {
        res.render('reabos',{
            user:req.user, 
            reabos:result
        });
    }).catch((err) => {
        console.log(err);
        res.status(403).json("error");
    });
})

module.exports=router