/*
    Developed by HellsCoder for HypeCloud
    @vk: vk.com/bytecode
*/

const Router = require('./heng-router');

const Dom = {

    dom_routes: [],

    interval: null,

    init: function(dom_routes){
        this.dom_routes = dom_routes;
    },

    select: function(selector){
        let str;
        if(typeof(selector) === "string"){
            str = selector;
            selector = document.querySelector(selector);
        }
        return {
            checked: function(){
                if(!str){
                    return -1;
                }
                selector = document.querySelectorAll(str);
                for(let i = 0; i < selector.length; i++){
                    let object = selector[i];
                    if(object.checked){
                        return object.value;
                    }
                }
                return -1;
            },
            /*
                Получение или установка значения
            */
            value: function(text){
                if(!text){
                    return selector.value;
                }
                selector.value = text;
            },
            /*
                Получение HTML или установка с обновлением событий
            */
            content: function(html){
                if(!html && html !== ''){
                    return selector.innerHTML;
                }
                selector.innerHTML = html;
                Dom.update();
                if(html.indexOf('href') !== -1){
                    Router.handlers.setHandlers();
                }
            },
            /*
                Добавление кода в конец элемента
            */
            push: function(html){
                let div = document.createElement("div");
                div.innerHTML = html;
                for(let i = 0; i < div.childNodes.length; i++){
                    selector.appendChild(div.childNodes[i]);
                }
                div.remove();
            },
            /*
                Добавление кода в начало элемента
            */
            pushTop: function(html){
                let div = document.createElement("div");
                div.innerHTML = html;
                for(let i = 0; i < div.childNodes.length; i++){
                    selector.insertBefore(div.childNodes[i], this.element().lastChild);
                }
                div.remove();
            },
            /*
                Получаем элемент
            */
            element: function(){
                return selector;
            }
        }
    },

    startHandle: function(){
        for(let i in this.dom_routes){
            let route = this.dom_routes[i];
            let selectors = document.querySelectorAll(route.selector);
            for(let i = 0; i < selectors.length; i++){
                let selector = selectors[i];
                selector.addEventListener(route.type, route.callback);
            }
        }
    },

    update: function(){
        for(let i in this.dom_routes){
            let route = this.dom_routes[i];
            let selectors = document.querySelectorAll(route.selector);
            for(let i = 0; i < selectors.length; i++){
                let selector = selectors[i];
                selector.removeEventListener(route.type, route.callback);
                selector.addEventListener(route.type, route.callback);
            }
        }       
    }

};

module.exports = Dom;
