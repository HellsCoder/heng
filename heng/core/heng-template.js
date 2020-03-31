/*
    Developed by HellsCoder for HypeCloud
    @vk: vk.com/bytecode
*/

const Http = require('./heng-http');
const Router = require('./heng-router');
const dom = require('./heng-dom');
const Logger = require('./heng-logger').getLogger("HENG");

const Template = {
    
    element: null,
    folder: null,
    callback: null,
    cache: [],

    init: function(element, folder, callback){
        this.element = element;
        this.folder = window.location.origin + "/" + folder;
        this.callback = callback;
        return this;
    },

    /*
        Функция отрисовки компонента
        componentFile - файл компонента из папки components в папке шаблонов
        componentName - имя компонента(его ID в файле компонентов)
        toElement - куда рендерить компонент
        callback? - обратный вызов после выполнения
    */
    renderComponent(componentFile, componentName, toElement, callback){
        if(!document.querySelector(toElement)){
            throw new "ComponentRenderError: dst render component not exist";
        }
        if(Template.cache[componentFile]){
            document.querySelector(toElement).innerHTML = Template.getBlockByTemplate(Template.cache[componentFile], '#'+componentName);
            Router.handlers.setHandlers();
            dom.startHandle();
            if(callback){
                callback();
            }
            return;
        }
        Http.request(Template.folder + '/components/' + componentFile, function(data){
            document.querySelector(toElement).innerHTML = Template.getBlockByTemplate(data, '#'+componentName);
            Template.cache[componentFile] = data;
            Router.handlers.setHandlers();
            dom.startHandle();
            if(callback){
                callback();
            }
        }, function(){
            throw new "ComponentRenderError: file component not exist";
        });
    },

    /*
        Функция отрисовки шаблона. 
        template - ссылка до шаблона
        variables - массив переменных который заменятся в шаблоне
        cover - два параметра [element - элемент, в который будет вставлятся шаблон; updatable(true/false) - обновляемый ли шаблон. ставить true если этот шаблон может быть вызван из левого меню]
        back - callback вызываемый после отрисовки шаблона
    */

    render: function(template, variables, cover, back){
        var trigger = false;

        beforeRender();

        /*
            Функция первичной отрисовки шаблона. Рисует шаблон FULL если его нет
        */
        function beforeRender(){
            if(this.element === null || this.folder === null){
                throw "TemplateRenderError: Init template before rendering";
            }
            if(cover.element){
                if(cover.updatable){
                    trigger = true;
                }               
                if(!document.querySelector(cover.element)){
                    var folder = template.split("/")[0];
                    Http.request(Template.folder + '/' + folder + '/full.html', function(data){
                        data = Template.compile(data, variables);
                        for(let i in variables){
                            data = data.replace('{{'+i+'}}', variables[i]);
                        }
                        document.querySelector(Template.element).innerHTML = data;    
                        afterRender(trigger);        
                    });
                }else{
                    afterRender(trigger);
                }
            }else{
                afterRender(trigger);
            }  
        }

        /*
            Функция, вызываемая после отрисовки FULL шаблона
            updatable - обновляемый ли шаблон(такой как профиль например, или друзья)
        */
        function afterRender(updatable){
            if(!Template.cache[template]){
                Http.request(Template.folder + '/' + template, function(data){
                    Template.cache[template] = data;
                    dataRender(data);
                });  
            }else{
                dataRender(Template.cache[template]);
            }
            
            function dataRender(data){
                if(updatable && document.querySelector('.updatable')){
                    data = Template.getBlockByTemplate(data, '.updatable');
                    cover.element = '.updatable';
                }
                for(let i in variables){
                    data = data.replace('{{'+i+'}}', variables[i]);
                }
                try{
                    if(cover.element){
                        document.querySelector(cover.element).innerHTML = data;
                        if(document.querySelector(cover.element).getElementsByTagName("script").length > 0){
                            var buff = document.querySelector(cover.element).getElementsByTagName("script")[0].innerHTML;
                            document.querySelector(cover.element).getElementsByTagName("script")[0].remove();
                            var append = document.createElement("script");
                            append.innerHTML = buff;
                            document.querySelector(cover.element).appendChild(append); 
                        }               
                    }else{
                        document.querySelector(Template.element).innerHTML = data;
                        if(document.querySelector(Template.element).getElementsByTagName("script").length > 0){
                            var buff = document.querySelector(Template.element).getElementsByTagName("script")[0].innerHTML;
                            document.querySelector(Template.element).getElementsByTagName("script")[0].remove();
                            var append = document.createElement("script");
                            append.innerHTML = buff;
                            document.querySelector(Template.element).appendChild(append); 
                        }                    
                    }           
                    if(Template.callback !== null){
                        Template.callback();
                    }
                    Router.handlers.setHandlers();
                    dom.startHandle();
                    if(back){
                        back();
                    }
                }catch(e){
                    console.info(e);
                    throw "TemplateRenderError: Template has no loaded by not found app element";
                }
            }
        }
    },

    /*
        Функция получения конкретного блока из шаблона, который вернул сервер
    */
    getBlockByTemplate: function(template, block){
        /*
            Создаем невидимый рабочий элемент
        */
        var utils;
        if(!document.getElementById("utils")){
            utils = document.createElement("div");
            utils.id = "utils";
            utils.style.display = 'none';
            utils.innerHTML = template;
        }else{
            utils = document.getElementById("utils");
            utils.innerHTML = template;
        }

        /*
            Достаем блок из элемента
        */
        if(!utils.querySelector(block)){
            return '';
        }
        var buffer = utils.querySelector(block).innerHTML;
        utils.innerHTML = '';
        return buffer;
    },

    /*
        Функция компиляции шаблона
    */

    compile: function(data, variables){

       /*
         Создаем невидимый рабочий элемент
       */
       let utils;
       if(!document.getElementById("utils")){
           utils = document.createElement("div");
           utils.id = "utils";
           utils.style.display = 'none';
           utils.innerHTML = data;
       }else{
           utils = document.getElementById("utils");
           utils.innerHTML = data;
       }

       let ifs = utils.getElementsByTagName("if");
       for(let i = 0; i < ifs.length; i++){
           let expression = ifs[i];
           if(!expression.hasAttribute("heng-condition")){
               Logger.log("Faield to handle IF expression. Attribute heng-data has required");
               continue;
           }
           let attr = expression.getAttribute("heng-condition");
           let inversion = false;
           if(attr.startsWith("!")){
               inversion = true;
               attr = attr.substr(1, attr.length);
           }
           if(!variables[attr] && inversion === false){
               expression.remove();
               continue;
           }
           let condition = variables[attr];
           if(inversion){
               condition = !condition;
           }
           if(!condition){
               expression.remove();
               continue;
           }
           expression.parentElement.innerHTML.replace(expression.outerHTML, expression.innerHTML);
       }

       let buff = utils.innerHTML;

       utils.innerHTML = '';

       return buff;
    }
};

module.exports = Template;
