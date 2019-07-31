var express = require('express');
var router = express.Router();
var loginManager=require('../db/loginManager');

router.get('/', function(req, res, next) {
  console.log("Here we go !");
  console.log(req.cookies);
  if(req.cookies.token){
    loginManager.readActiveUserByToken(req.cookies.token)
    .then((result) => {
      let user = result[0];
      if(user){
        req.user=user;
        res.render('index',{ 
          title: 'Linesat',
          user:user
        });
      }else{
        res.redirect('/login');
      }
    }).catch((err) => {
      res.redirect('/login');
    });
  }else{
    res.redirect('/login');
  }
});

router.get('/login',async(req,res)=>{
  res.render('login');
});

router.get('/logout',async(req,res)=>{
  loginManager.disconnectUser(req.cookies.token)
  .then((result) => {
    res.cookie('token','',{
      maxAge:Date.now()
    });
  }).catch((err) => {
    console.log(err);
  });
  res.redirect('/login');
})

router.post('/login',async(req,resp)=>{
  loginManager.authenticateUser(req.body)
  .then((result)=>{
    console.log("Authentification");
    console.log(result);
    if(result.length>0){
      resp.cookie('token',result[0].token,{
        maxAge:new Date(Date.now() + (1000*60*60*24)),
      })
      resp.redirect('/');
    }
  })
  .catch((error)=>{
    resp.redirect('/login');
  });
})

module.exports = router;
