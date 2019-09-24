const connection = require('./connection').config;
let crypto = require('crypto');
const agencyManager= require('./agencesManager');

const HASH_ALGORITHM =require('../settings.json').defaultEncryption;

function LoginManagerBuilder(){
    return {
        authCustomer(session,{emailOrPhone,password}){
            return new Promise((resolve,reject)=>{
                if(!emailOrPhone || !password){
                    reject("Identifiant invalide");
                }
                let pass = crypto.createHash(HASH_ALGORITHM).update(password).digest('hex');
                let customer = null;
                let customers = session.getSchema(connection.database).getCollection("customers");
                customers.find("(contact.email=:usr OR contact.phone=:usr) AND passwordHash=:pass")
                .fields(["_id","contact","identity","code"])
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
            console.log(username,password);
            return new Promise((resolve,reject)=>{
                if(!username || !password){
                    reject("Invalid credentials");
                }

                let item = null;
                
                password=crypto.createHash(HASH_ALGORITHM).update(password).digest('hex');
                let sys=session.getSchema(connection.database).getCollection("sysadmins");
                sys.find("credentials.username=:usrn  AND credentials.passwordHash=:pass")
                .bind("usrn",username)
                .bind("pass",password)
                .fields(['_id','owner','roles'])
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
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        authAgencyUser(session,{username,password}){
            return new Promise((resolve,reject)=>{
                if(!username || !password){
                    reject();
                }
                
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
                .fields(['_id','owner','agency','roles','creationDate'])
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
        },

        matchPasswordOfCustomer(session,ref="",pass=""){
            return new Promise((resolve,reject)=>{
                let user ;
                let schema = session.getSchema(connection.database);
                let customers=schema.getCollection("customers");

                customers.find("_id=:ref")
                .bind("ref",ref)
                .execute((_)=>{
                    user=_;
                })
                .then(()=>{
                    let hashed_given_pass = crypto.createHash(HASH_ALGORITHM).update(pass).digest('hex');
                    if(hashed_given_pass === user.passwordHash){
                        resolve(true);
                    }
                    else{
                        resolve(false);
                    }
                })
				.catch((er)=>{
					console.log(er);
					reject(er);
				})
            })
        }

    };
}

module.exports=LoginManagerBuilder;
