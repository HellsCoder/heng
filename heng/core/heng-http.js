var Http = {
    request: function(url, callback, error, bool){
      var req = new XMLHttpRequest();
      if(!bool){
        req.open("GET", url + "?" + new Date().getTime(), true);
      }else{
        req.open("GET", url, true);
      }
      req.addEventListener("load", function() {
        if (req.status < 400)
          callback(req.responseText);
        else
          error();
      });
      req.addEventListener("error", function() {
        error();
        throw "HengHttpError: Network not available"
      });
      req.send(null);        
    }
}

module.exports = Http;
