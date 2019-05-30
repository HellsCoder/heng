const Require = {
    css: function(href){
        let link = document.createElement("link");
        link.href = href;
        link.type = 'text/css';
        link.rel = 'stylesheet';
        document.body.appendChild(link);
    },
    
    js: function(link, callback){
        let script = document.createElement("script");
        script.src = link;
        document.body.appendChild(script);
        if(callback){
            script.onload = () => {
                callback(true);
            }
            script.onerror = () => {
                callback(false);
            }
        }
    }
};

module.exports = Require;