


function generateInt(first,last){
    return Number.parseInt(Math.random() * (last - first) + first);
}

module.exports = function generateNumberString(length=12){
    let str='';
    for(let i = 0 ; i < length ; i++){
        str+=generateInt(0,9);
    }
    return str;
}