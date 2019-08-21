const connection = require('./connection').config;
const crypto=require('crypto');

/**
 * NEVER TRUST USER INPUT !
 * KEEP INSPECTING CODE TO DETECT DEAD CODE,
 */

function CustomerManagerBuilder(){
    return {

        create(session,obj={}){
            return new Promise((resolve,reject)=>{
                if(obj.gender)obj.gender=obj.gender.toLowerCase();
                if(obj.lastName) obj.lastName=obj.lastName.toUpperCase();
                if(!obj.lastName || !obj.firstName  || !obj.gender){
                    reject("Firstname and LastName are required");
                    return;
                }
                if ( !obj.gender==='man' || obj.gender==='woman'){
                    reject("gender must be man or woman");
                    return;
                }

                if(!obj.email && !obj.phone){
                    reject('We need you email or your phone');
                    return;
                }

                if(!obj.password){
                    reject("Your password is not set");
                    return;
                }

                if(obj.password){
                    obj.password= crypto.createHash('SHA1').update(obj.password).digest('hex');
                }
    
                let clientDoc={
                    identity:{
                        name:{
                            first:obj.firstName,
                            last:obj.lastName
                        },
                        gender:obj.gender
                    },
                    contact:{
                        email:obj.email,
                        phone:obj.phone
                    },
                    code:crypto.randomBytes(4).join(''),
                    passwordHash:obj.password,
                }

                session.startTransaction();
                let schema=session.getSchema(connection.database);
                let customers=schema.getCollection("customers");
                let rs=customers.add(clientDoc);
                rs.execute((res)=>{
                    console.log(res);
                })
                .then((rs)=>{
                    session.commit();
                    resolve(rs);
                })
                .catch((err)=>{
                    console.log(err);
                    session.rollback();
                    reject(err);
                });
            })
        },
    
        readByRef(session,id=''){
            return new Promise((resolve,reject)=>{
                let schema= session.getSchema(connection.database);
                let customers= schema.getCollection("customers");
                let customer=null;
                customers.find("_id=:id")
                .bind("id",id)
                .execute((rs)=>{
                    customer=rs;
                })
                .then((stat)=>{
                    if(customer)resolve(customer);
                    reject();
                })
                .catch((err)=>{
                    console.log(err);
                    reject(err);
                })
            })
        },
    
        readByCustomerCode(session,code=''){
            return new Promise((resolve,reject)=>{
                let schema= session.getSchema(connection.database);
                let customers= schema.getCollection("customers");
                let customer=null;
                customers.find("code=:code")
                .bind("code",code)
                .execute((rs)=>{
                    customer=rs;
                })
                .then((stat)=>{
                    if(customer) resolve(customer);
                    reject();
                })
                .catch((err)=>{
                    console.log(err);
                    reject(err);
                })
            })
        },
        
        readAll(session){
            return new Promise((resolve,reject)=>{
                let schema= session.getSchema(connection.database);
                let customers= schema.getCollection("customers");
                let docs=[];
                customers.find()
                .execute((rs)=>{
                    docs.push(rs);
                })
                .then((stat)=>{
                    resolve(docs);
                })
                .catch((err)=>{
                    console.log(err);
                    reject(err);
                })
            })
        },
    
        patch(session,id="",obj={}){
            return new Promise((resolve,reject)=>{
                let identity={
                    name:{
                        first:obj.identity.name.first,
                        last:obj.identity.name.last
                    },
                    gender:obj.identity.gender
                };

                let contact={
                    email:obj.contact.email,
                    phone:obj.contact.phone
                };
                let newDoc={
                    identity:identity,
                    contact:contact,
                    updateDate:Date.now()
                }

                if(obj.password){
                    // Validate password first !
                    newDoc.passwordHash=crypto.createHash('SHA1').update(obj.password).digest('hex');
                }

                console.log("Patching customer");

                let customers = session.getSchema(connection.database).getCollection("customers");
                customers.modify("_id=:id")
                .bind("id",id)
                .patch(newDoc)
                .execute()
                .then((rs)=>{
                    console.log(rs);
                    resolve(rs);
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },
    
        delete(session,id=""){
            return new Promise((resolve,reject)=>{
                let customers = session.getSchema(connection.database).getCollection("customers");
                customers.removeOne("_id=:id")
                .bind("id",id)
                .execute()
                .then((rs)=>{
                    console.log(rs);
                    resolve(rs);
                })
            })
        }
    };    
}

module.exports=CustomerManagerBuilder;