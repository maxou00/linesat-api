const agencyUserManager = require ('../../db/agencyUserManager')();
const users= require('../../db/constants').UserType;
/**
* This middleware is intented to be used for administration role.
* By the way, this mw will be able to read the request and inject a [role] attribute for the given user
* 
* @param {Express.Request} req 
* @param {Express.Response} res 
* @param {Function} next 
*/

function handleRole(req,res,next){
    if( req.user && req.user.uid && (req.user.type===users.AGENCY || req.user.type===users.SYSTEM )){
        agencyUserManager.readUserByRef(req.dbSession,req.user.uid)
        .then((user)=>{
            req.roles=user.roles;
            next();
        })
        .catch(err=>{
            next();
        })
    }else{
        next();
    }
}

module.exports=handleRole;