var express = require('express');
var router = express.Router();
var loginManager=require('../db/loginManager');
var compteManager=require('../db/comptesManager');
let clientManager=require('../db/clientsManager');

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
    console.log(req.user);
    if(req.user.type=='SYSTEM'){
        compteManager.readAllClientAccounts()
        .then((result) => {
            res.render('comptes-clients',{
                user:req.user,
                comptes:result
            })
        }).catch((err) => {
            console.log(err);
        });
    }else{
        compteManager.readClientAccountsWhereAgenceIs(req.user.idagence)
        .then((result) => {
            res.render('comptes-clients',{
                user:req.user,
                comptes:result
            })
        }).catch((err) => {
            console.log(err);
        });
    }
})

router.post('/newclient',async(req,res)=>{
    clientManager.create(req.body)
    .then((result) => {
        console.log(result);
        res.redirect('/comptes');
    }).catch((err) => {
        console.log(err);
        res.redirect('/comptes');
    });
})

module.exports=router