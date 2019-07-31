
const loadingTemplate=`
<div class="overlay-content">
    <div class='loader'></div>
    <div>
        <p>Chargement du formulaire</p>
    </div>
</div>
`

function requireComponent(component=''){
    overlay.prepare(loadingTemplate);
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange=(event)=>{
        if(xhr.readyState==4 && (xhr.status==200 || xhr.status==304)){
            overlay.prepare(xhr.responseText);
        }
    }

    xhr.open('GET',component,true);
    xhr.send();
}