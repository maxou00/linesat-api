var express = require('express');
var router = express.Router();
var loginManager=require('../db/loginManager');
var bouquetManager=require('../db/bouquetsManager');

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

router.get('/',(req,resp)=>{
    console.log(req.cookies.token);
    if(req.user.type=='SYSTEM'){
        bouquetManager.readAll()
        .then((result) => {
            resp.render('bouquets',{
                user:req.user,
                bouquets:result
            },(err,html)=>{
                console.log(err);
                resp.send(html);
            })
        }).catch((err) => {
            console.log(error); 
            resp.json("error");
        });
    }else{
        bouquetManager.readAllByCriteria({visibility:'VISIBLE'})
        .then((result) => {
            resp.render('bouquets',{
                user:req.user,
                bouquets:result
            })
        }).catch((err) => {
            console.log(error); 
            resp.json("error");
        });
    }
})

router.get('/update/:id',async(req,res)=>{
    if(req.user.type=='SYSTEM'){
        bouquetManager.read(req.params.id)
        .then((result) => {
            console.log(result);
            res.render('bouquet-update',{
                bouquet:result[0]
            });
        }).catch((err) => {
            console.log(err);
            res.render('bouquet-update');
        });
    }else{
        res.status(403).json("error");
    }
})

router.post('/update/:id',async(req,res)=>{
    if(req.user.type=='SYSTEM'){
        bouquetManager.update(req.params.id,req.body)
        .then((result) => {
            res.redirect('/bouquets');
        }).catch((err) => {
            res.status(500).json("Error");
        });
    }else{
        res.status(403).json("error");
    }
})

router.get('/disable/:id',async(req,res)=>{
    if(req.user.type=='SYSTEM'){
        bouquetManager.update(req.params.id,{visibility:'HIDDEN'})
        .then((result) => {
            res.redirect('/bouquets');
        }).catch((err) => {
            res.status(500).json("Error");
        });
    }else{
        res.status(403).json("error");
    }
})

router.get('/enable/:id',async(req,res)=>{
    if(req.user.type=='SYSTEM'){
        bouquetManager.update(req.params.id,{visibility:'VISIBLE'})
        .then((result) => {
            res.redirect('/bouquets');
        }).catch((err) => {
            res.status(500).json("Error");
        });
    }else{
        res.status(403).json("error");
    }
})

module.exports=router;