
function generateInt(first,last){
    return Number.parseInt(Math.random() * (last - first) + first);
}

function generateNumberString(length=16){
    let str='';
    for(let i = 0 ; i < length ; i++){
        str+=generateInt(0,9);
    }
    return str;
}

module.exports=generateNumberString;