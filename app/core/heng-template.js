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
    rendered: {
        template: null,
        variables: null
    },

    init: function(element, folder, callback){
        this.element = element;
        this.folder = window.location.origin + "/" + folder;
        this.callback = callback;
        return this;
    },

    replaceAll: function (target, search, replacement){
        return target.split(search).join(replacement);
    },

    replaceAllVars: function(content, variables){

        let getPaths = (tr) => {
            let paths = [];
          
            function findPath(branch, str) {
              Object.keys(branch).forEach(function (key) {
                if (branch[key] instanceof Array || branch[key] instanceof Object){
                    findPath(branch[key], str ? str + "." + key : key);
                }else{
                    paths.push({
                        path: '{{' + (str ? str + "." + key : key) + '}}',
                        value: branch[key]
                    });
                }
              });    
            }
          
            findPath(tr, "");
            return paths;
        }

        let allPaths = getPaths(variables);
        for(let key in allPaths){
            let path = allPaths[key];
            content = Template.replaceAll(content, path.path, path.value);
        }

        return content;
    },

    /*
        Функция отрисовки компонента
        componentFile - файл компонента из папки components в папке шаблонов
        componentName - имя компонента(его ID в файле компонентов)
        toElement - куда рендерить компонент
        callback? - обратный вызов после выполнения
    */
    renderComponent(componentFile, componentName, toElement, variables, callback){
        if(!document.querySelector(toElement)){
            throw new "ComponentRenderError: dst render component not exist";
        }
        if(Template.cache[componentFile]){
            let content = Template.getBlockByTemplate(Template.cache[componentFile], '#'+componentName);
            if(variables){
                content = Template.compile(content, variables);
            }
            document.querySelector(toElement).innerHTML = content;
            Router.handlers.setHandlers();
            dom.startHandle();
            if(callback){
                callback();
            }
            return;
        }
        Http.request(Template.folder + '/components/' + componentFile, function(data){
            let content = Template.getBlockByTemplate(data, '#'+componentName);
            if(variables){
                content = Template.compile(content, variables);
            }
            document.querySelector(toElement).innerHTML = content;
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

        /*
            Защита от повторной перерисовки шаблона
        */

        if(Template.rendered.template === template && JSON.stringify(Template.rendered.variables) === JSON.stringify(variables)){
            back();
            this.callback();
            return;
        }

        Template.rendered = {
            template: template,
            variables: variables
        };

        beforeRender();

        /*
            Функция первичной отрисовки шаблона. Рисует шаблон FULL если его нет
        */
        function beforeRender(){
            if(this.element === null || this.folder === null){
                throw "TemplateRenderError: Init template before rendering";
            }
            if(cover && cover.element){
                if(cover.updatable){
                    trigger = true;
                }               
                if(!document.querySelector(cover.element)){
                    var folder = template.split("/")[0];
                    Http.request(Template.folder + '/' + folder + '/full.html', function(data){
                        data = Template.compile(data, variables);
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
                data = Template.compile(data, variables);
                if(updatable && document.querySelector('.updatable')){
                    data = Template.getBlockByTemplate(data, '.updatable');
                    cover.element = '.updatable';
                }
                try{
                    if(cover && cover.element){
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

        data = Template.replaceAllVars(data, variables);

        let array = [
            'heng-if',
            'heng-for'
        ];


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

        let checkIncluded = (utils) => {
            for(let i = 0; i < array.length; i++){
                if(utils.getElementsByTagName(array[i])){
                    return true;
                }
            }
            return false;
        };

        let checkIsParents = (element) => {
            while(element.parentElement !== null){
                if(array.includes(element.parentElement.tagName.toLocaleLowerCase())){
                    return true;
                }
                element = element.parentElement;
            }
            return false;
        };

        let parse = (json) => {

            /*
                XSS Fix
                В цикле объект загоняется в JSON, по этому вовращемое значение от сервера экранируется в обратную сторону. Тут мы его экранируем опять по новой, к нормальному значению
            */

            let xss = document.createElement("div");
            xss.innerText = json;
            json = xss.innerHTML;
            xss.remove();

            try{
                json = JSON.parse(decodeURI(json));
                if(!(json instanceof Object)){
                    return false;
                }
                return json;
            }catch(e){
                return false;
            }
        };

        let included = false;

        let ifs = utils.getElementsByTagName("heng-if");
        for(let i = 0; i < ifs.length; i++){
            let expression = ifs[i];

            if(checkIsParents(expression)){
                continue;
            }

            if(!variables){
                expression.remove();
                i--;
                continue;
            }

            if(!expression.hasAttribute("condition")){
                Logger.log("Faield to handle HENG-IF expression. Attribute condition has required");
                continue;
            }
            let attr = expression.getAttribute("condition");
            let inversion = false;
            if(attr.startsWith("!")){
                inversion = true;
                attr = attr.substr(1, attr.length);
            }
            if(!variables[attr] && inversion === false){
                if(attr != true && attr != "true" && attr != 1){
                    expression.remove();
                    i--;
                    continue;
                }
                variables[attr] = true;
            }
            let condition = variables[attr];
            if(inversion){
                condition = !condition;
            }
            if(!condition){
                expression.remove();
                i--;
                continue;
            }

            if(checkIncluded(expression)){
                included = true;
            }
            
            expression.parentElement.innerHTML = expression.parentElement.innerHTML.replace(expression.outerHTML, expression.innerHTML);
        }


        let fors = utils.getElementsByTagName("heng-for");
        for(let i = 0; i < fors.length; i++){
            let expression = fors[i];

            if(checkIsParents(expression)){
                continue;
            }


            if(!variables){
                expression.remove();
                continue;
            }

            if(!expression.hasAttribute("array")){
                Logger.log("Failed to handle HENG-FOR expression. Attribute array has required");
                continue;
            }
            let attr = expression.getAttribute("array");
            let as = expression.hasAttribute("as") ? expression.getAttribute("as") : false;
            if(!variables[attr]){
                let parser = parse(attr);
                if(!parser){
                    expression.remove();
                    continue;
                }
                variables[attr] = parser;
            }
            let exp_code = expression.innerHTML;
            expression.innerHTML = '';
            for(let key in variables[attr]){
                let obj = variables[attr][key];
                let replaced;
                for(let v in obj){
                    if(typeof(obj[v]) !== "string"){
                        obj[v] = encodeURI(JSON.stringify(obj[v]));
                    }
                    if(as){
                        replaced = replaced ? Template.replaceAll(replaced, as + '.' + v, obj[v]) : Template.replaceAll(exp_code, as + '.' + v, obj[v]);
                    }else{
                        replaced = replaced ? Template.replaceAll(replaced, attr + '.' + v, obj[v]) : Template.replaceAll(exp_code, attr + '.' + v, obj[v]);
                    }
                }
                expression.innerHTML += replaced;
            }

            if(checkIncluded(expression)){
                included = true;
            }

            expression.parentElement.innerHTML = expression.innerHTML;
        }

        let buff = utils.innerHTML;

        if(included){
            buff = Template.compile(buff, variables);
        }

        utils.innerHTML = '';

        buff = Template.replaceAllVars(buff, variables);

        return buff;
    }
};

module.exports = Template;
