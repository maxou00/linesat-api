const agencyManager= require('./agencesManager');
const connection = require('./connection').config;
const crypto=require('crypto');

const HASH_ALGORITHM='SHA1';

function AgencyUserManagerBuilder(){
    return {
        createUser(session,{user={},agency=''}){
            return new Promise((resolve,reject)=>{

                /// TODO: Add Data Validation.
                /// Never trust user input.

                if(!user.firstName || !user.lastName){
                    reject('user must have a name');
                    return;
                }

                if(!user.gender){
                    reject("Sex is required");
                    return;
                }

                if(!agency){
                    reject('Agency is required');
                    return;
                }

                if(! user.username || !user.password){
                    reject('Username and password are required');
                    return;
                }
            
                let doc={
                    owner:{
                        name:{
                            first:user.firstName,
                            last:user.lastName
                        },
                        gender:user.gender || 'man'
                    },
                    roles:{
                        grantLevel:( user.grantLevel >= 1 && user.grantLevel <= 4 ) ? user.grantLevel : 1
                    },
                    agency:agency,
                    credentials:{
                        username:user.username,
                        passwordHash:crypto.createHash(HASH_ALGORITHM).update(user.password).digest('hex')
                    },
                    creationDate:Date.now()
                }

                let users=session.getSchema(connection.database).getCollection("agencyUsers");

                /// Check if the given username-password combination isn't already used.
                let found=null;
                users.find("credentials.username=:usr AND credentials.password=:pass")
                .bind('usr',user.username)
                .bind('pass',doc.credentials.passwordHash)
                .execute((_)=>{
                    found=_;
                })
                .then((r)=>{
                    if(found){
                        reject('Your username or password is already used.');
                        return;
                    }
                    else{
                        return users.add(doc).execute();
                    }
                })
                .then((rs)=>{
                    let id= rs.getGeneratedIds();
                    if(id && id[0]){
                        resolve();
                    }else{
                        reject('An error occured');
                    }
                })
                .catch((err)=>reject(err));
            })
        },

        readUserByRef(session,ref=''){
            return new Promise((resolve,reject)=>{
                let schema= session.getSchema(connection.database);
                let agencyUsers=schema.getCollection("agencyUsers");
                let user=null;
                agencyUsers.find("_id=:id")
                .bind("id",ref)
                .execute((rw)=>{
                    user=rw;
                })
                .then((res)=>{
                    // Execute's callback not called. No Results.
                    if(user) resolve(user);
                    reject();      
                })
                .catch((err)=>{
                    reject(err);
                })
            });
        },

        readUsersByAgency(session,agencyRef=''){
            return new Promise((resolve,reject)=>{
                let docs=[];
                let schema= session.getSchema(connection.database);
                let agencyUsers=schema.getCollection("agencyUsers");
                agencyUsers.find("agency=:id")
                .bind("id",agencyRef)
                .execute((rw)=>{
                    docs.push(rw);
                })
                .then((res)=>{
                    resolve(docs);
                    reject();      
                })
                .catch((err)=>{
                    reject(err);
                })
            });
        },

        compareAgencyOfUsers(session,{userA,userB}){
            return new Promise((resolve,reject)=>{
                let ua=null;ub=null;
                this.readUserByRef(session,userA)
                .then((user)=>{
                    ua = user;
                    return this.readUserByRef(session,userB);
                })
                .then((user)=>{
                    ub = user;
                    if(ua.agency === ub.agency){
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                })
                .catch(err=>{
                    reject(err);
                })
            });
        },

        creditUser(session,uid='',creditUp=1){
            return new Promise((resolve,reject)=>{
                this.readUserByRef(session,uid)
                .then((user)=>{
                    let nlvl= user.roles.grantLevel + creditUp;
                    if(nlvl > 4){
                        nlvl=4;
                    }

                    let schema = session.getSchema(connection.database);
                    let users = schema.getCollection("agencyUsers");
                    return users.modify("_id=:id")
                    .bind("id",uid)
                    .set('roles.grantLevel',nlvl)
                    .execute();
                })
                .then((rs)=>{
                    resolve();
                })
                .catch((err)=>{
                    reject(err);
                })
            });
        },

        discreditUser(session,uid='',down=1){
            return new Promise((resolve,reject)=>{
                this.readUserByRef(session,uid)
                .then((user)=>{
                    let nlvl= user.roles.grantLevel - down;
                    if(nlvl < 0){
                        nlvl=1;
                    }

                    let schema= session.getSchema(connection.database);
                    let users=schema.getCollection("agencyUsers");
                    return users.modify("_id=:id")
                    .bind("id",uid)
                    .set('roles.grantLevel',nlvl)
                    .execute();
                })
                .then((rs)=>{
                    resolve();
                })
                .catch((err)=>{
                    reject(err);
                })
            });
        }
    }
    
}

module.exports = AgencyUserManagerBuilder;