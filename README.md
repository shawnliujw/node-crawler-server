casper-crawler
=====================

Web crawler base casperjs and phantomjs , with job queue



##How to install
npm install casper-crawler


##How to use


###scrape

prepare script file you want to execute
script.js with follow format
`exports.details = function(casper,callback){

  //casper is instance of casperjs  
  //dosomething();  
  var json = {};//the object will be returned    

 callback();    
}`

var casperCrawler = require("casper-crawler");
var page = {
"url":"http url",
"script":"script.js"

};
casperCrawler.scrape(page,"details",0)// if set expiration=0, will drop cache in the DB
.then(function(result){
console.log(result);

})

###clearCache

var urls = ["urls1","url2"];

//there are two params
//1. depend on the name you are using in your script
//2. urls need to be removed

casperCrawler.clearCache("details",urls);

##Test
