window.onhashchange=(event)=>{
    nextRoute(window.location.hash.slice(1));
}
let firstLoad=true;

window.addEventListener('load',(event)=>{
    if(firstLoad==true){
        firstLoad=false;
    }else{
        nextRoute(window.location.hash.slice(1));
    }
})

function loading(selector,message=""){
    var el= document.querySelector(selector);
    let template=`<div class='loading'>
        <div class='loader'></div>
        <p>${message}</p>
    </div>`
    el.innerHTML=template;
}

function message(selector,message=""){
    var el= document.querySelector(selector);
    let template=`<div class='loading'>
        <p>${message}</p>
    </div>`
    el.innerHTML=template;
}

function error(message=""){

}

function nextRoute(route="/",method="GET",headers={},data={}){
    loading(".main-body","Chargement des informations...");
    var messageZone=document.querySelector(".main-body");
    var xhr= new XMLHttpRequest();
    xhr.onreadystatechange=(event)=>{
        if(xhr.readyState==4 && xhr.status==200){
            messageZone.innerHTML=xhr.responseText;
        }
    }

    for (const key in headers) {
        if (headers.hasOwnProperty(key)) {
            const element = headers[key];
            xhr.setRequestHeader(key,element);
        }
    }

    xhr.open(method,route);
    if(data){
        xhr.send(data);
    }

}
