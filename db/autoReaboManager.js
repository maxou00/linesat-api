const connection = require('./connection');

class AutoReaboManager{

    create(obj={}){
        return new Promise((resolve,reject)=>{
            let query=`INSERT INTO reabo_auto SET ?`;
            connection.query(query,obj,(err,res)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(res);
                }
            })
        })
    }

    read(id=0){
        return new Promise((resolve,reject)=>{
            let query=`SELECT * FROM reabo_auto WHERE id=?`;
            connection.query(query,(err,res)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(res);
                }
            })
        })
    }

    readAll(){
        return new Promise((resolve,reject)=>{
            let query=`SELECT * FROM reabo_auto`;
            connection.query(query,(err,res)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(res);
                }
            })
        })
    }

    update(id=0,obj={}){
        return new Promise((resolve,reject)=>{
            let query=`UPDATE reabo_auto SET ? WHERE id=?`;
            connection.query(query,[obj,id],(err,res)=>{
                if(err){
                    reject(err);
                }else{
                    resolve(res);
                }
            })
        })
    }
}

module.exports=new AutoReaboManager();