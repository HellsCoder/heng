/*
    Developed by HellsCoder for HypeCloud
    @vk: vk.com/bytecode
*/

var pathToRegexp = require('path-to-regexp');

var Router =  {
    
    routes: [],

    elements: [
        "a",
        "div",
        "button"
    ],

    /*
        Функция которая вызывается при инициализации роутера,
        watchever - функция которая вызовется тогда, когда роутера нет
        routes - массив роутов
    */
    init: function(watchever, routes){
        if(watchever){
            this.watchever.watchever(watchever);
        }
        this.routes = routes;
        this.dispatch(true);

        window.addEventListener("popstate", function(e){
            var url = new URL(window.location.href);
            Router.navigation().go(url.pathname);
        });
    },

    /*
        Функция которая вызывается при переходе на любую страницу. Проверяет разрешение на повторное исполнение роута 
    */
    dispatch: function(prevent){
        var path = Router.navigation().current();
        for(var i in this.routes){
            var route = this.routes[i];
            if(route.dispached && prevent){
               continue; 
            }
            var regexp = pathToRegexp(route.link);
            var exec = regexp.exec(path);
            if(route.link === path || exec){
                if(exec){
                    exec = exec.splice(exec.length-3, 3);
                    if(exec.length > 2){
                        exec = exec.slice(1);
                    }
                    route.callback(exec);
                }else{
                    route.callback();
                }
                route.dispached = true;
                return;
            }
        }
        this.watchever.watcheverCall();
    },
    /*
        Функция, которая вызывает каллбек роута, и если в адресе есть переменные - собирает их в массив и кидает в каллбек. Выполняется в обход разрешений на повторное исполнение
    */
    determite: function(link){
        this.state.allow();
        link = link.split("?")[0];
        for(let i in this.routes){
            var route = this.routes[i];
            var regexp = pathToRegexp(route.link);
            var exec = regexp.exec(link);           
            if(route.link === link || exec){
                if(exec){
                    exec = exec.splice(exec.length-3, 3);
                    if(exec.length > 2){
                        exec = exec.slice(1);
                    }
                    route.callback(exec);
                }else{
                    route.callback();
                }
                route.dispached = true;
                return;
            }
        }    
        this.watchever.watcheverCall();    
    },

    /*
        Получаем информацию о браузере
    */

    browser: function(){
        return {
            getBrowser: function(){
                var userAgent = navigator.userAgent.toLowerCase();
                if (userAgent.indexOf("msie") != -1 && userAgent.indexOf("opera") == -1 && userAgent.indexOf("webtv") == -1) {
                    return "msie";
                }
                if (userAgent.indexOf("opera") != -1) {
                     return "opera";
                }
                if (userAgent.indexOf("gecko") != -1) {
                     return "gecko";
                }
                if (userAgent.indexOf("safari") != -1) {
                     return "safari";
                }
                if (userAgent.indexOf("konqueror") != -1) {
                     return "konqueror";
                }
                return "unknown";
            }
        }
    },

    /*
        Функции для работы с адресной строкой
    */
    navigation: function(){
        return {
            go: function(href){
                if(Router.browser().getBrowser() === "gecko"){
                    window.history.pushState("", "", href); 
                    window.history.replaceState("", "", href);                  
                }else{
                    window.location.hash = href;
                }
                Router.determite(href);
            },

            current: function(){
                var str = window.location.href;
                var url = new URL(str);
        
                var path = url.pathname;
                return path;
            }
        }
    },

    /*
        Функции для работы с обработчиками. Перехват кликов, назначение и снятие обработчиков
    */

    handlers: {
        setHandlers: function(){
            for(let i = 0; i < Router.elements.length; i++){
                this.setHandle(Router.elements[i]);
            }
        },

        setHandle: function(element){
            for(let i = 0; i < document.getElementsByTagName(element).length; i++){
                var link = document.getElementsByTagName(element)[i]; 
                if(link.hasAttribute("href") && link.getAttribute("href").startsWith("/")){
                    link.removeEventListener("click", this.listen, true);
                    link.addEventListener("click", this.listen, true);
                }           
            }                            
        },

        listen: function(e){
            e.preventDefault();                    
            if(this.hasAttribute("href") && this.getAttribute("href") != Router.navigation().current()){
                Router.navigation().go(this.getAttribute('href'));
            }            
        }

    },

    /*
        Функция которая не дает исполняться обработчиком роутов повторно
    */
    watchever: {
        watchever_callback: null,

        called: false,

        watchever: function(callback){
            this.watchever_callback = callback;
        },

        watcheverCall: function(){
            if(this.watchever_callback !== null && !this.called){
                this.watchever_callback();
                this.called = true;
            }
        }
    },

    
    /*
        Разрешаем исполняться обработчику роутера повтороно
    */
    state: {
        allow: function(){
            var link = Router.navigation().current();
            for(let i in Router.routes){
                var route = Router.routes[i];
                if(route.link === link){
                    route.dispached = false;
                }
            }
            Router.watchever.called = false;
        }
    }    

};


module.exports = Router;
