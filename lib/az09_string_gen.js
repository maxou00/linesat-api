

/**
 * 
 * @param {number} length 
 * Generates a string ([0-9A-Z]{length})
 * Designed for coupon code. length should be 9.
 * We have  1.015599566e14 possibilities /
 */
function generateAZ09String(length=9){

    let filled = [
        '0','1','2','3','4','5','6','7','8',
        '9','A','B','C','D','E','F','G','H',
        'I','J','K','L','M','N','O','P','Q',
        'R','S','T','U','V','W','X','Y','Z'
    ];

    let gen="";
    for(var i=0;i<length;i++){
        let index = Math.round(Math.random() * (filled.length-1));
    
        console.log(index);
        gen+=filled[index]; /// Generates an index between 0 and filled's last index
    }

    return gen.toUpperCase();
}



module.exports=generateAZ09String;