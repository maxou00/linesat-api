const connection = require('./connection').config;
const crypto=require('crypto');

const HASH_ALGORITHM="SHA1"
function AgencyManagerBuilder(){
    return {
        create(session,obj={}){
            return new Promise((resolve,reject)=>{
                let agencyDoc={
                    identity:{
                        name:obj.name
                    },
                    location:{
                        city:obj.city || '',
                        country:obj.country || '',
                        street:obj.street||'',
                        geo:{}
                    },
                    contact:{
                        email:obj.email || '',
                        phone:obj.phone || ''
                    },
                    creationDate:Date.now()
                }
    
                if(true){
                //if(obj.country && obj.city && obj.name && obj.street && obj.initialAmount){
    
                    let schema=session.getSchema(connection.database);
                    session.startTransaction();
                    ///STEP 1: Insert Agency and wait for generated id
                    let agencies=schema.getCollection("agencies");
                    agencies.add(agencyDoc).execute()
                    .then((rs1)=>{
                        console.log(rs1);
                        /// STEP 2: Retrieve generated id
                        let genIds=rs1.getGeneratedIds();
                        if(genIds && genIds[0]){
                            // continue
                            console.log(1);
                            let agencyAdminDoc={
                                owner:{
                                    name:{
                                        first:obj.userFirstName,
                                        last:obj.userLastName
                                    },
                                    gender:obj.userGender,
                                },
                                agency:genIds[0],
                                credentials:{
                                    username:obj.username,
                                    passwordHash:crypto.createHash(HASH_ALGORITHM).update(obj.password).digest('hex')
                                },
                                roles:{
                                    grants:[1,2,3]
                                },
                                creationDate:Date.now()
                            }
                                /// STEP 3: Create role 
                            let agencyUsers=schema.getCollection("agencyUsers");
                            agencyUsers.add(agencyAdminDoc).execute()
                            .then((rs2)=>{
                                if(rs2){
                                    console.log(2);
                                    //continue 
                                    let agencyAccountDoc={
                                        type:"BUSINESS",
                                        amount:obj.initialAmount,
                                        agency:genIds[0],
                                        creationDate:Date.now()
                                    }
                                    ///STEP 4: Create business account
                                    schema.getCollection("accounts").add(agencyAccountDoc).execute()
                                    .then((rs3)=>{
                                        if(rs3){
                                            // OK DONE ! 
                                            /// LAST: finish session
                                            console.log(3);
                                            session.commit()
                                            .then(()=>{
                                                resolve({id:genIds[0]});
                                            })    
                                        }
                                       /* session.rollback();
                                        session.done();
                                        reject();*/
                                    })
                                    .catch((err)=>{
                                        /*session.rollback();
                                        session.done();
                                        reject(err);*/
                                    })
                                }
                            })
                            .catch((err)=>{
                               /* session.rollback();
                                session.done();
                                reject(err);*/
                            })
                        }
                        /* session.rollback();
                        session.done();
                        console.log(rs1.getGeneratedIds());*/
                    })
                }else{
                    reject("Le nom et le prix sont necessaires");
                }
            })
        },

        readAll(session){
            return new Promise((resolve,reject)=>{
                let docs=[];
                let schema=session.getSchema(connection.database);
                schema.getCollection("agencies").find().execute((doc)=>{
                    docs.push(doc);
                })
                .then((rs1)=>{
                    resolve(docs);
                });
            })
        },

        readByRef(session,ref=''){
            return new Promise((resolve,reject)=>{
                let schema = session.getSchema(connection.database);
                    let agencies = schema.getCollection("agencies");
                    let agency=null;
                    agencies.find("_id=:id")
                    .bind("id",ref)
                    .execute((rw)=>{
                        console.log(rw);
                        agency=rw;
                    })
                    .then((res)=>{
                        // Execute's callback not called. No Results.
                        console.log('results has come');
                        if(agency){
                            resolve(agency);
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

        update(session,id='',obj={}){
            return new Promise((resolve,reject)=>{
                let query=`UPDATE agence SET ? WHERE idagence=?`;
                connection.query(query,[obj,id],(err,res)=>{
                    if(err){
                        reject(err);
                    }else{
                        resolve(res);
                    }
                })
            })
        }


    };
   
}

module.exports=AgencyManagerBuilder;