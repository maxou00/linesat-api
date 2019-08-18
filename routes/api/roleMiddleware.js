const agencyUserManager = require ('../../db/agencyUserManager')();
const sysUsers= require('../../db/sysAdminsManager')();
const users= require('../../lib/constants').UserType;
/**
* This middleware is intented to be used for administration role.
* By the way, this mw will be able to read the request and inject a [role] attribute for the given user
* 
* @param {Express.Request} req 
* @param {Express.Response} res 
* @param {Function} next 
*/

function handleRole(req,res,next){
    if( req.isSystem || req.isAgency){
        if(req.isSystem){
            sysUsers.readByRef(req.dbSession,req.user.uid)
            .then((user)=>{
                req.roles=user.roles;
                req.roleAvailable=true;
                next();
            })
            .catch(err=>{
                req.roleAvailable=false;
                next();
            })
        }else{
            agencyUserManager.readUserByRef(req.dbSession,req.user.uid)
            .then((user)=>{
                req.roles=user.roles;
                req.roleAvailable=true;
                next();
            })
            .catch(err=>{
                req.roleAvailable=false;
                next();
            })
        }
        
    }else{
        next();
    }
}

module.exports=handleRole;