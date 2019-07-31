let express=require("express");
let loginManager= require('../../db/loginManager');
let agencyUserManager= require('../../db/agencyUserManager');
let agencyManager= require('../../db/agencesManager');
let handler=require('./customerHandler').MobileSession;
let router =express.Router();
let userType=require('../../db/constants').UserType;

router.post('/sys/login',(req,resp)=>{
    console.log(req.session);

    function newHandler(){
        loginManager().authSysAdmin(req.dbSession,req.body)
        .then((result) => {
            req.session.uid=result['_id'];
            req.session.userType=userType.SYSTEM;
            req.session.connectionDate=Date.now();
            req.session.cookie.sameSite=true;
            req.session.cookie.path='/sys';
            req.session.save((err)=>{
                if(err){
                    console.log(err);
                    resp.status(500).json({success:false,message:'An error occured.'})
                }else{
                    resp.json({
                        success:true,
                        result:{
                            user:result
                        }
                    });
                }
            })
        })
        .catch((err) => {
            resp.status(403).json(
            {
                success:false,
            });
        });
    }

    if(req.session.userType===userType.AGENCY){
        req.session.regenerate(err=>{
            if(err) {
                resp.status(403).json({success:false});
            }else{
                newHandler();
            }
        })
    }else{
        newHandler();
    }
})

router.post('/agency/login',(req,resp)=>{
    console.log(req.session);
    if(req.session.uid && req.session.agencyID && req.session.userType===userType.AGENCY){
        console.log('Good !!!');
        agencyUserManager().readUserByRef(req.dbSession,req.session.uid)
        .then((user)=>{
            agencyManager().readByRef(req.dbSession,req.session.agencyID)
            .then((agency)=>{
                resp.json({success:true,result:{user:user,agency:agency}})
            })
            .catch((err)=>{
                resp.status(403).json({success:false});
            })
        })
        .catch((err)=>{
            ///Disconnect user ???
            resp.status(403).json({success:false});
        })
    }
    else{
        loginManager().authAgencyUser(req.dbSession,req.body)
        .then((result) => {
            req.session['uid']=result.user['_id'];
            req.session['userType']=userType.AGENCY;
            req.session['agencyID']=result.agency['_id'];
            req.session['connectionDate']=Date.now();
            req.session.cookie.sameSite=true;
            req.session.cookie.path='/agency';
            resp.json({
                success:true,
                result:result
            });
        })
        .catch((err) => {
            console.log("Here we go !");
            console.log(err);
            resp.status(403).json(
            {
                success:false,
            });
        });
    }
})

router.post('/customer/login',(req,resp)=>{
    if(req){
        console.log(req.body);
        loginManager().authCustomer(req.dbSession,req.body)
        .then((cust)=>{
            let session = handler();
            session.generate()
            .then(()=>{
                console.log(session);
                session.data.uid=cust['_id'];
                session.data.createdAt=Date.now();
                session.persist(req.sessionStore.client)
                .then(()=>{
                    resp.json({success:true,user:cust,token:session.sid});
                })
                .catch((err)=>{
                    console.log(`Mobile Session Persistance Error ${err}`)
                })
            })
            .catch((err)=>{
                console.log(err);
            })
        })
        .catch((err)=>{
            console.log(err);
            resp.status(403).json({success:false});
        })
    }
})

router.post('/logout',(req,res)=>{
    if(req.session){
        req.session.destroy((err)=>{
            if(err){
                console.warn(err);
            }
            resp.json({success:true});
        })
    }else{
        resp.status(403).json({success:false,message:'You are not logged in.'});
    }
})

module.exports=router;