/**
 * Prepare la creation d'un nouveau bouquet
 * en ouvrant la boite chevauchante, preparant le formulaire 
 * et les actions des boutons.
 */
function prepareNewBouquet(){
    var hasDoneAction=false;
    let script = document.querySelector('#bouquet-form');
    overlay.prepare(script.text);

    var node = document.querySelector('.overlay');
    var closer= document.querySelector('.close-overlay');
    var confirm= document.querySelector('.form-confirm');
    var form = document.forms['newBouquet'];
    
    closer.onclick=(event)=>{
        if(hasDoneAction){
            window.location.reload();
        }else{
            overlay.destroy();
        }
    }

    const unsetError=(node)=>{
        try{
            node.setCustomValidity('');
        }catch(e){}
    }

    form.nom.oninvalid=(event)=>{
        form.nom.setCustomValidity("Le nom est important");
    }

    form.onkeypress=(event)=>{
        unsetError(form.nom); 
        unsetError(form.prix);
    }

    form.nom.onchange=(event)=>{
        unsetError(form.nom);
    }

    form.prix.oninvalid=(event)=>{
        form.prix.setCustomValidity("Le prix est necessaire");
    }

    form.prix.onchange=(event)=>{
        unsetError(form.prix);
    }

    confirm.onclick=(event)=>{
        event.preventDefault();
        if(form.reportValidity()){
            var data={
                nom:form.nom.value,
                description:form.description.value,
                prix:form.prix.value
            }

            let messageNode= form.querySelector('#form-message');

            let xhr= new XMLHttpRequest();

            xhr.onloadstart=(event)=>{
                confirm.disabled=true;
                loading("#form-message","Traitement ...");
            }

            xhr.onreadystatechange=(event)=>{
                if(xhr.readyState==4 && xhr.status==200){
                    message("#form-message","Contenu ajouté");
                    hasDoneAction=true;
                }
                else if( xhr.status==304){ // Not modified
                    message("#form-message","Le contenu n'a pas eté ajouté.\nUn bouquet de ce nom existe probablement deja.");
                }
                else if( xhr.status==403){
                    message("#form-message","Cette action ne vous est pas autorisé");
                }
                else if( xhr.status > 400){
                    message("#form-message","Une erreur est survenue.");
                }

                console.log(xhr.responseText);
            }

            xhr.onloadend=(event)=>{
                confirm.disabled=false;
            }

            xhr.open('PUT','/api/bouquets',true);
            xhr.setRequestHeader('Content-Type','application/json;charset=utf8');
            xhr.send(JSON.stringify(data));
            console.log(data);
        }
        else{
            if(!form.nom.checkValidity()){
                form.nom.setCustomValidity('Le nom du bouquet est necessaire');
            }
            if(!form.prix.checkValidity()){
                form.prix.setCustomValidity('Vous devez mentionner le prix de ce bouquet');
            }
        }
    }
}