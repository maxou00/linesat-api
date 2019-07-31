const agencyUserManager = require ('../../db/agencyUserManager')();

/**
* This middleware is intented to be used for administration role.
* By the way, this mw will be able to read the request and inject a [role] attribute for the given user
* 
* @param {Express.Request} req 
* @param {Express.Response} res 
* @param {Function} next 
*/

function handleRole(req,res,next){
    if(req.session.agencyID){
        agencyUserManager.readUserByRef(req.dbSession,req.session.uid)
        .then((user)=>{
            req.user_roles=user.roles;
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