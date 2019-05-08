/*
    Это конфиг вебпака, его лучше не трогать
*/

module.exports = {
  context: __dirname,
  entry: "./heng/app.js",
  output: {
    path: __dirname + "/build",
    filename: "bundle.js"
  },
  module:{
    rules:[
    ]
  }
}