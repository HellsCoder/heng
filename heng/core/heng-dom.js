/*
    Developed by HellsCoder for HypeCloud
    @vk: vk.com/bytecode
*/

var dom = {

    dom_routes: [],

    interval: null,

    init: function(dom_routes){
        this.dom_routes = dom_routes;
    },

    startHandle: function(){
        for(let i in this.dom_routes){
            var route = this.dom_routes[i];
            var selectors = document.querySelectorAll(route.selector);
            for(let i = 0; i < selectors.length; i++){
                var selector = selectors[i];
                selector.addEventListener(route.type, route.callback);
            }
        }
    },

    update: function(){
        for(let i in this.dom_routes){
            var route = this.dom_routes[i];
            var selectors = document.querySelectorAll(route.selector);
            for(let i = 0; i < selectors.length; i++){
                var selector = selectors[i];
                selector.removeEventListener(route.type, route.callback);
                selector.addEventListener(route.type, route.callback);
            }
        }       
    }

};

module.exports = dom;
