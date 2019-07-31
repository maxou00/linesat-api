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
                if(true){}

                let doc={
                    owner:{
                        name:{
                            first:user.firstName,
                            last:user.lastName
                        },
                        gender:user.gender || 'men'
                    },
                    roles:{
                        grants:user.grants.concat([])
                    },
                    agency:agency,
                    credentials:{
                        username:user.userName,
                        passwordHash:crypto.createHash(HASH_ALGORITHM).update(user.password).digest('hex')
                    },
                    creationDate:Date.now()
                }

                let users=session.getSchema(connection.database).getCollection("agencyUsers");
                users.add(doc).execute()
                .then(()=>{
                    resolve();
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
        }
    }
    
}

module.exports = AgencyUserManagerBuilder;