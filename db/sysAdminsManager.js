const connection = require('./connection').config;

function  SystemAdminsManagerBuilder(){

    return {
        readByRef(session,ref=''){
            return new Promise((resolve,reject)=>{
                let sysadmins = session.getSchema(connection.database).getCollection('sysadmins');

                let sysadmin = null;

                sysadmins.find("_id=:id")
                .bind("id",ref)
                .execute((_)=>{
                    sysadmin=_;
                })
                .then((rs)=>{
                    resolve(sysadmin);
                })
                .catch(err=>{
                    reject(err);
                })
            })
        }
    }
}


module.exports=SystemAdminsManagerBuilder;