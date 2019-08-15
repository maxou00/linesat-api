const jwt=require('jsonwebtoken');
const enums = require('../db/constants');
const TOKEN_HEADER="x-access-token";

/**
 * @param {Express.Request} req 
 * @param {Express.Response} resp 
 * @param {function} next 
 */

function  handleToken(req,resp,next){
    const PRIVATE_KEY="com.linetechnologie.linesat.api.there_Is-a-pie@2019-InTheSky";
    let token = req.headers[TOKEN_HEADER];
    if(/^([\w-]+).([\w-]+).([\w-]+)$/gm .test(token)){
        let decoded=jwt.verify(token,PRIVATE_KEY);
        if(decoded){
            req.user=decoded;
            if(decoded.type===enums.UserType.AGENCY){
                req.isAgency=true;
            }
            else if(decoded.type===enums.UserType.CUSTOMER){
                req.isCustomer=true;
            }
            else if(decoded.type===enums.UserType.SYSTEM){
                req.isSystem=true;
            }
        }
    }
    next();
}

module.exports = handleToken;