const connection = require('./connection').config;
let crypto = require('crypto');
const agencyManager= require('./agencesManager');
const HASH_ALGORITHM ="SHA1";

function LoginManagerBuilder(){
    return {
        authCustomer(session,{emailOrPhone,password}){
            return new Promise((resolve,reject)=>{
                let pass = crypto.createHash(HASH_ALGORITHM).update(password).digest('hex');
                let customer = null;
                let customers = session.getSchema(connection.database).getCollection("customers");
                customers.find("(contact.email=:usr OR contact.phone=:usr) AND passwordHash=:pass")
                .bind("usr",emailOrPhone)
                .bind("pass",pass)
                .execute((row)=>{
                    customer=row;
                })
                .then((res)=>{
                    if(customer){
                        resolve(customer);
                    }else{
                        reject();
                    }
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        authSysAdmin(session,{username,password}){
            return new Promise((resolve,reject)=>{
                let item = null;
                password=crypto.createHash(HASH_ALGORITHM).update(password).digest('hex');
                let sys=session.getSchema(connection.database).getCollection("sysadmins");
                sys.find("credentials.username=:usrn  AND credentials.passwordHash=:pass")
                .bind("usrn",username)
                .bind("pass",password)
                .execute((row)=>{
                    item=row;
                })
                .then((res)=>{
                    if(item){
                        resolve(item);
                    }
                    else{
                        reject();
                    }
                })
            })
        },

        authAgencyUser(session,{username,password}){
            return new Promise((resolve,reject)=>{
                let hash=crypto.createHash(HASH_ALGORITHM).update(password).digest('hex');
                let schema= session.getSchema(connection.database);
                let agencyUsers=schema.getCollection("agencyUsers");
                let agencies= schema.getCollection("agencies");
    
                let user=null;
                let agency=null;
                ///FIND the given USER 
                agencyUsers.find("credentials.username=:usr AND credentials.passwordHash=:pass")
                .bind("usr",username)
                .bind("pass",hash)
                .execute((row)=>{
                    /// FIND THE AGENCY IN WHICH (HE|SHE) IS A VALID USER
                    user=row;
                })
                .then((rs)=>{
                    if(user){
                        return agencyManager().readByRef(session,user['agency']);
                    }
                    else{
                        reject();
                    }
                })
                .then((ag)=>{
                    agency=ag;
                })
                .then((res)=>{
                    // Execute's callback not called. No Results.
                    if(user && agency) {
                        resolve({user:user,agency:agency});
                    }else{
                        reject();
                    }
                })
                .catch((err)=>{
                    console.log(err);
                    reject(err);
                })
            })
        }
    
    };

}

module.exports=LoginManagerBuilder;