const overlay={
    nodeSelector:'.overlay',
    node:null,
    available:false,
    isVisible:false,
    init:(force=false)=>{
        if(!overlay.available || force){
            overlay.node = document.querySelector(overlay.nodeSelector);
            if(overlay.node){
                overlay.available=true;
            }
        }
    },
    loadContent:(stringContent)=>{
        overlay.init();
        overlay.node.innerHTML=stringContent;
    },
    toggleNode:()=>{
        overlay.init();
        overlay.isVisible=overlay.node.classList.toggle('overlay-show');
    },
    prepare:(stringContent)=>{
        overlay.loadContent(stringContent);
        if(!overlay.isVisible){
            overlay.toggleNode();
        }
    },
    destroy:()=>{
        if(overlay.isVisible){
            overlay.toggleNode();
        }
        overlay.loadContent('');
    }
}