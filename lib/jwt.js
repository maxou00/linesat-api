const Buffer = require('buffer').Buffer;
const crypto= require('crypto');
const uuidV4=require('uuid/v4');
const BASE_64='base64';

const PRIVATE_KEY="com.linetechnologie.linesat.api.there_Is-a-pie@2019-InTheSky";

const ISSUER="com.linetechnologie.linesat.api.authservice";

const RESERVED_HEADER_ATTRS=[
    'cty',//Content Type
    'alg',//Algorithm
    'typ',
]

const  RESERVED_BODY_ATTRS=[
    'iat',// issued at
    'exp',// expiry
    'sub',//subject
    'iss',//issuer
    'aud',// audience
    'nbf',
    'jti',//JWT ID
]

function SessionBuilder(){
    return {

        sign(message={}){
            let head={
                'alg':'HS256', /// Defines the algorithm used to sign the token . Here HMAC-SHA256
                'typ':'JWT' /// defines the token type .Here JWT 
            }

            let body = {
                iat:Date.now(), // Issued AT
                exp:Date.now(), // expiry
                msg:JSON.stringify(message),
                iss:ISSUER
            }

            let bhead= base64Url(JSON.stringify(head));
            let bbody=base64Url(JSON.stringify(body));

            let signature=formatTobase64Url(crypto.Hmac('SHA256',PRIVATE_KEY)
            .update(`${bhead}.${bbody}`)
            .digest(BASE_64));

            return token = `${bhead}.${bbody}.${signature}`;
        },

        verify(token=''){
            let regex=/^([\w-]+)\.([\w-]+)\.([\w-]+)$/gm; /// regex used to extract head, body and signature parts
            if(regex.test(token)){
                let arry=regex.exec(token);
                let bs64Head= arry[1];
                let bs64Body= arry[2];
                let signature= arry[3]; /// Base64 encoded signature
            }
        }
    }
}

/**
 * 
 * @param {string} data 
 * Simple Valid base64 URL transformer 
 * @See RFC 7529
 */

function  base64Url(data=''){
    return formatTobase64Url(
        Buffer
        .from(data)
        .toString(BASE_64)
    );
}


/**
 * 
 * @param {string} str 
 * 
 * formats a string according to base64 Specification
 */
function formatTobase64Url(str=''){
    return str.replace(/=/g,"") //Replace every `=` by `''`
        .replace(/\+/g,"-")//Replace each `+` by `-`
        .replace(/\//g,"_"); /// Replace each `/` by _
}
