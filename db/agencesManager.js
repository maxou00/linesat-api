const connection = require('./connection').config;
const crypto=require('crypto');

const accountManager= require('./comptesManager')();
const HASH_ALGORITHM= require('../settings.json').defaultEncryption;

function AgencyManagerBuilder(){
    return {
        create(session,obj={}){
            return new Promise((resolve,reject)=>{
                let valid=true;

                /// !!!! NEXT VALIDATION LEVEL !!!! <<<TEST USER DETAILS AGAINST EXPRESSIONS>>>

                /// Validate Localisation informations
                ///Set Default Country. Algorithm will be reviewed when multi country support arrives.
                obj.country='BJ';
                console.log(obj);
                
                if( !obj.country || !obj.city ){
                    valid=false;
                    reject("Invalid position informations");
                }
                ///Validate identity informations
                if( !obj.name){
                    valid=false;
                    reject("Invalid Identity informations");
                }
                ///Validate contact . Email AND phone number are required
                if( !obj.email || !obj.phone ){
                    valid=false;
                    reject("Invalid Contact informations");
                }
                ///Validate admin account details
                if( !obj.userFirstName || !obj.userLastName || !obj.userGender || !obj.username || !obj.password){
                    valid=false;
                    reject("Invalid Administrator informations");
                }
                /// Validate financial details 
                if(!obj.initialAmount){
                    valid=false;
                    reject("Invalid Financial informations");
                }

                if(valid){
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
                            phone:{
                                code:"+229",
                                number:obj.phone
                            }
                        },
                        creationDate:Date.now()
                    }
                    
                    let schema=session.getSchema(connection.database);
                    session.startTransaction();
                    ///STEP 1: Insert Agency and wait for generated id
                    let agencies=schema.getCollection("agencies");
                    let genId='';
                    let genAAId=''; /// Generated Agency Account ID
                    agencies.add(agencyDoc).execute()
                    .then((rs1)=>{
                        console.log(rs1);
                        /// STEP 2: Retrieve generated id
                        genId=rs1.getGeneratedIds()[0];
                        console.log(genId);
                        if(genId){
                            let agencyAdminDoc={
                                owner:{
                                    name:{
                                        first:obj.userFirstName,
                                        last:obj.userLastName
                                    },
                                    gender:obj.userGender,
                                },
                                agency:genId,
                                credentials:{
                                    username:obj.username,
                                    passwordHash:crypto.createHash(HASH_ALGORITHM).update(obj.password).digest('hex')
                                },
                                roles:{
                                    grantLevel:4
                                },
                                creationDate:Date.now()
                            }
                            /// STEP 3: Create agencyAdmin
                            let agencyUsers=schema.getCollection("agencyUsers");
                            return agencyUsers.add(agencyAdminDoc).execute();
                        }
                    })
                    .then((rs2)=>{
                        if(rs2){
                            return accountManager.createAgencyAccount(session,genId);
                        }
                        else{
                            throw new Error("the agency admin was not created");
                        }
                    })
                    .then((gid)=>{
                        if(gid){
                            genAAId=gid;
                            if(genAAId){
                                // Good. Agency Account has been created. 
                                //Let's transact the initial Amount from the root account to the newly created account
                                return accountManager.readRootAccountDetails(session);
                            }
                        }else{
                            throw new Error("the agency account was not created");
                        }
                    })
                    .then((rootAccount)=>{
                        if(rootAccount){
                            let reason = `Initial Amount ${obj.initialAmount} into agency account ${genAAId}.`;
                            return accountManager.transact(session,{from:rootAccount._id,to:genAAId,amount:obj.initialAmount,reason:reason})
                        }
                    })
                    .then(val=>{
                        return session.commit()
                    })
                    .then(val=>{
                        return session.done();
                    })
                    .then((val)=>{
                        resolve(genId);
                    })
                    .catch(err=>{
                        ///ABORT THE PROCESS
                        session.rollback();
                        reject(err);
                    })
                }else{
                    reject('Invalid Request');
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
                if(!ref){
                    reject("The reference was not given");
                }
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