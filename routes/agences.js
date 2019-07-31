var express=require('express');
var router= express.Router();
var loginManager=require('../db/loginManager');
var agencesManager=require('../db/agencesManager');

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


router.get('/',async(req,resp)=>{
    if(req.user.type=='SYSTEM'){
        agencesManager.readAllWithFullInfo()
        .then((result) => {
            console.log(result);
            resp.render('agences',{
                user:req.user,
                agences:result
            })
        }).catch((err) => {
            console.log(err);
        });
    }
})

router.get('/close/:id',async(req,res)=>{
    agencesManager.update(req.params.id,{
        activity:'CLOSED'
    })
    .then((result) => {
        res.redirect('/agences');
    }).catch((err) => {
        res.redirect('/agences');
    });
})

router.get('/activate/:id',async(req,res)=>{
    agencesManager.update(req.params.id,{
        activity:'ACTIVE'
    })
    .then((result) => {
        res.redirect('/agences');
    }).catch((err) => {
        res.redirect('/agences');
    });
})

router.post('/new',async(req,res)=>{
    agencesManager.create(req.body)
    .then((result) => {
        res.redirect('/agences');
    }).catch((err) => {
        res.redirect('/agences');
    });
})
module.exports=router;