const MAGIC_USER_AGENT='com.linetechnologie.linesat';
const VALID_CUSTOMER_TYPE='CUSTOMER';
const crypto=require('crypto');

function customerSessionHandler(req,resp,next){
    ///STEP 1
    ///Check if special  headers are set (x-access-key and x-user-agent);
    let access = req.headers['x-access-key'];
    let agent= req.headers['x-user-agent'];
    if(access && (agent === MAGIC_USER_AGENT)){
        ///Continue
        //STEP 2:  Create an instance of MobileSession Class and load it from Redis Store using access key
        let mobileSession = MobileSession();
        mobileSession.dumpFromStore(access,req.sessionStore.client)
        .then(()=>{
            if(mobileSession.hasLoaded){
                ///Great News ! the mobile Session exists. We're gonna go ahead
                ///Step 3: Define the loaded mobile session instance into the request 
                req.mobileSession=mobileSession;
                req.mobileActive=true;
                next(); 
            }else{
                next();
            }
        })
        .catch((err)=>{
            console.log(err);
            next();
        })
    }else{
        next(); 
    }
};

const MOBILE_SESSION_NAMESPACE="mobileSession";

const MAX_RANDOM=0xff;
const MIN_RANDOM=0x01;

function MobileSession(){
    return {
        sid:'',
        hasLoaded:false,
        hasPersisted:false,
        isDestroyed:false,
        data:{},
        generate(){
            return new Promise((resolve,reject)=>{
                let timestamp=Date.now();
                let r1=Math.random()*MAX_RANDOM;
                let r2=Math.random()*MIN_RANDOM;
                let r3=r1*r2;
                let hash=crypto.createHash('SHA1').update(`${r1}-${timestamp}-${r3}-${MAGIC_USER_AGENT}-${r2}`).digest('hex');
                this.sid=hash; 
                resolve();
            })
        },
        persist(redisClient){
            return new Promise((resolve,reject)=>{
                redisClient.set(`${MOBILE_SESSION_NAMESPACE}:${this.sid}`,JSON.stringify(this.data),(err,res)=>{
                    if(err){
                        this.hasPersisted=false;
                        reject();
                    }else{
                        this.hasPersisted=true;
                        resolve();
                    }
                });
            })
        },
        destroy(redisClient){
            return new Promise((resolve,reject)=>{
                redisClient.del(`${MOBILE_SESSION_NAMESPACE}:${this.sid}`,(err,res)=>{
                    console.log('Mobile Session Destroyed from Redis Store');
                    if(err){
                        this.isDestroyed=false;
                        reject();
                    }else{
                        this.isDestroyed=true;
                        resolve();
                    }
                })
            })
        },
        dumpFromStore(sid='',redisClient){
            return new Promise((resolve,reject)=>{
                redisClient.get(`${MOBILE_SESSION_NAMESPACE}:${sid}`,(err,res)=>{
                    if(res){
                        this.sid=sid;
                        this.data=JSON.parse(res);
                        this.hasLoaded=true;
                        resolve();
                    }else{
                       reject();
                    }
                })
            })
        }
    };
}

module.exports={
    router:customerSessionHandler,
    MobileSession:MobileSession
};