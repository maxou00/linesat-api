const connection = require('./connection').config;


const BOUQUET_STATE_ACTIVE="active";
const BOUQUET_STATE_LOCKED="locked";

function BouquetsManagerBuilder(){
    return {
        create(session,obj={}){
            return new Promise((resolve,reject)=>{
                if(obj.label && obj.price){
                    //obj.nom=obj.nom.toUpperCase();
                    if(typeof obj.price === "string"){
                        obj.price=Number.parseInt(obj.price);
                    }
                    let bouquetDoc={
                        label:obj.label,
                        description:obj.description,
                        pricing:{
                            price:obj.price,
                            timeUnit:"MONTH",
                            currency:"XOF",
                        },
                        creationDate:Date.now(),
                        state:BOUQUET_STATE_ACTIVE // active || locked 
                    };
                    let bouquets=session.getSchema(connection.database).getCollection("bouquets");
                    bouquets.add(bouquetDoc).execute()
                    .then((res)=>{
                        resolve(res);
                    })
                    .catch((err)=>{
                        reject(err);
                    })
                }else{
                    reject("Le nom et le prix sont necessaires");
                }
            })
        },

        readByRef(session,id=''){
            return new Promise((resolve,reject)=>{
                let doc=null;
                let bouquets=session.getSchema(connection.database).getCollection("bouquets");
                bouquets.find("_id=:id")
                .bind('id',id)
                .execute(dc=>{
                    doc=dc;
                })
                .then((res)=>{
                    resolve(doc);
                })
                .catch((err)=>{
                    reject(err);
                })
            });
        },

        readAll(session){
            return new Promise((resolve,reject)=>{
                let docs=[];
                let bouquets=session.getSchema(connection.database).getCollection("bouquets");
                bouquets.find()
                .execute(doc=>{
                    docs.push(doc);
                })
                .then((rs)=>{
                    resolve(docs);
                })
            });
        },

        patch(session,id='',obj={}){
            return new Promise((resolve,reject)=>{
                session.getSchema(connection.database).getCollection("bouquets")
                .modify("_id=:id")
                .bind("id",id)
                .patch(obj)
                .limit(1)
                .execute()
                .then((rs)=>{
                    resolve();
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        lock(session,id=''){
            return new Promise((resolve,reject)=>{
                let bouquets=session.getSchema(connection.database).getCollection("bouquets");
                    bouquets
                    .modify("_id=:id")
                    .bind("id",id)
                    .patch({state:BOUQUET_STATE_LOCKED})
                    .limit(1)
                    .execute()
                    .then((rs)=>{
                        resolve();
                    })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        activate(session,id=''){
            return new Promise((resolve,reject)=>{
                let bouquets=session.getSchema(connection.database).getCollection("bouquets");
                bouquets
                .modify("_id=:id")
                .bind("id",id)
                .patch({state:BOUQUET_STATE_ACTIVE})
                .limit(1)
                .execute()
                .then((rs)=>{
                    resolve();
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        },

        delete(session,id=''){
            return new Promise((resolve,reject)=>{
                let bouquets=session.getSchema(connection.database).getCollection("bouquets");
                bouquets
                .remove("_id=:id")
                .bind("id",id)
                .limit(1)
                .execute()
                .then((rs)=>{
                    resolve();
                })
                .catch((err)=>{
                    reject(err);
                })
            })
        }
    
    };

}

module.exports= BouquetsManagerBuilder;