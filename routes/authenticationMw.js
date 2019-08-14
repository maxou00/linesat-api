const jwt=require('jsonwebtoken');

const TOKEN_HEADER="x-access-token";

/**
 * 
 * @param {Express.Request} req 
 * @param {Express.Response} resp 
 * @param {function} next 
 */
function  handleToken(req,resp,next){
    const PRIVATE_KEY="com.linetechnologie.linesat.api.there_Is-a-pie@2019-InTheSky";
    let token = req.headers[TOKEN_HEADER];
    if(token){
        let decoded=jwt.verify(token,PRIVATE_KEY);
        if(decoded){
            req.user=decoded;
        }
    }
    next();
}

module.exports = handleToken;