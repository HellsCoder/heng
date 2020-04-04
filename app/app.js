/*
    Это главный файл SPA приложения

    Follow me: 
    @vk: vk.com/bytecode
*/

const Router = require('./core/heng-router');
const Template = require('./core/heng-template');
const DOM = require('./core/heng-dom');

/*
  Файлы роутов
*/
const routes = require('./routes/routes');
const routes_dom = require('./routes/routes_dom');


const initApplication = () => {
    Template.init('#app', 'templates', () => {
      /* Вызывается когда любой шаблон отрисован */
    });
    
    DOM.init(routes_dom);
    
    Router.init(() => {
      /* Совершен переход на несуществующий роут */
    }, routes);
};




/*
  Загружаем приложение при загрузке страницы
*/
window.onload = initApplication;
