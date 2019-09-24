const jwt=require('jsonwebtoken');
const enums = require('../lib/constants');

const tokenConfig = require('../settings.json').token;
/**
 * @param {Express.Request} req 
 * @param {Express.Response} resp 
 * @param {function} next 
 */

function  handleToken(req,resp,next){
    let token = req.headers[tokenConfig.header];
    if( token && /^([\w-]+).([\w-]+).([\w-]+)$/gm .test(token)){
        let decoded=jwt.verify(token,tokenConfig.privateKey);
        if(decoded){
            req.user=decoded;
            req.token=token;
            console.log(decoded);
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