const Logger = {
    /*
        Устанавливаем префикс логгера
    */
    getLogger: function(name){
        /*
            Сам логгер
        */
        return {
            log: function(message){
                console.info('%c[%c'+name+'%c] %c' + message, 'font-weight:bold;', 'color: blue;font-weight:bold;', 'font-weight:bold;', 'font-weight: normal;');
            }
        }
    }
};

module.exports = Logger;
