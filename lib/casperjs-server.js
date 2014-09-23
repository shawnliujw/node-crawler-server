var system = require("system");
var Logger = require('./utils/casperLogger');
var logger = new Logger(system.env.CASPER_LOG_FILE || './casper.log');

var casper = require('casper').create({
	viewportSize: {width: 1920, height: 1080},
	pageSettings: {
		"userAgent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/33.0.1750.149 Safari/537.36",
		"loadImages": false,
		"loadPlugins": false
	},
	verbose: true,
	logLevel: system.env.CASPER_LOG_LEVEL ? system.env.CASPER_LOG_LEVEL.toLowerCase() : 'debug'
});

var config = JSON.parse(system.args[system.args.length - 1]);
var server = require('webserver').create();
casper.start();
var timeout = 5000;
var service = server.listen(config.port, function(request, response) {
	casper.on('remote.message', function(msg) {
		logger.info('<REMOTE MESSAGE> ' + msg);
	});
	casper.then(function() {
		//var method = request.method;
		if (request.url === '/scrape') {
			var postData = request.post;
			postData = this.evaluate(function(s) {
				return JSON.parse(s);
			}, postData);

			if (postData) {
				_process(postData, response);
			} else {
				_output(JSON.stringify({
					"status": false,
					"message": "There is no urls to be updated."
				}), response);
			}
		} else {//used for ping server , check it's health
			_output("server is running.", response);
		}
	});
	casper.on("exit", function(msg) {
		logger.error("Casper server exit:" + msg);
		casper.log("Casper server exit:" + msg, "error");
	});
	casper.on("error", function(msg) {
		logger.error("Casper server occour error:" + msg);
		casper.log("Casper server occour error:" + msg, "error");
	});

	casper.on("log", function(msg) {
		if (msg) {
			logger.info(msg.message);
		}
	});
	casper.on("resource.error", function(resourceError) {
		//only write log into casper log file , for the log that need to send back to node process. see below
		logger.error("Resource error:" + JSON.stringify(resourceError));

		// here change the log lever of resource.error from error to debug
		// due many these log are occoure like 'Operation canceled' , etc,  normally these kind of error won't cause two terrible issue
		// so in the production we don't want them to be inserted into log file . 
		// in dev eviroment we will use level debug ,there information will come out.
		casper.log("Resource error:" + JSON.stringify(resourceError), "debug");

	});
	casper.run(function() {
		logger.info("Casper listening on port " + config.port);
		casper.log("Casper listening on port " + config.port, "info");
	});
});
function _process(params, res) {
	var products = [];
	var outputJson = {
		"status": false,
		"message": ""
	};
	casper.eachThen(params, function(job) {
		var url = job.data.url;
		var method = job.data.method;
		var retailerFile = job.data.script;
		var json = {
			status: false,
			url: url,
			updateTime: new Date().toUTCString(),
			script: retailerFile.split("/").slice(-1).join("/")
		};
		var script = require(retailerFile);

		if (script) {
			// allow script to make changes to the url prior to opening
			if (script.redirect) {
				url = script.redirect(url);
				json.actualURL = url;
			}
			this.thenOpen(url, function onResponse(response) {
				json.code = response.status;
				switch (response.status) {
					case 200 :
						try {
							if (script[method]) {
								script[method](casper, timeout, function(productDetails) {
									if (productDetails) {
										productDetails.url = json.url;
										productDetails.updateTime = json.updateTime;
										productDetails.script = json.script;
										productDetails.timestamp = (new Date()).getTime();
										if (json.actualURL)
											productDetails.actualURL = json.actualURL;
										productDetails.code = json.code;
										logger.info("SCRAPED with method '"+ method +"' :" + JSON.stringify(productDetails));
										casper.log(JSON.stringify(productDetails),"info");
										products.push(productDetails);
									} else {
										json.message = "Selector not found, maybe invalid  page or need new selector.";
										products.push(json);
									}
								});

							} else {
								json.message = "unknown method " + method;
								products.push(json);
							}

						} catch (e) {
							json.message = e.message;
							products.push(json);
						}
						break;
					case 404:
						json.status = true;
						json.stock = "notfound";
						products.push(json);
						break;
					case 410:
						json.status = true;
						json.stock = "notfound";
						products.push(json);
						break;
					default:
						json.status = false;
						json.message = "Failed to access  site " + url + " - "
								+ (response ? JSON.stringify(response) : "");
						products.push(json);
				}

			}, function onTimeout() {
				json.message = "Timeout opening " + url;
				products.push(json);
			}, timeout);

		} else {
			json.message = retailerFile + " not found";
			products.push(json);
		}

	});

	casper.then(function() {
		if (products.length === params.length) {
			outputJson.status = true;
			outputJson.results = products;
		} else {
			outputJson.status = false;
			outputJson.message = "responses received:" + products.length + " - responses expected:" + params.length;
			outputJson.params = params;
			outputJson.results = products;
		}
		_output(JSON.stringify(outputJson), res);
	});

	casper.on("error", function(msg, backtrace) {
		outputJson.message = msg;
		outputJson.status = false;
		_output(JSON.stringify(outputJson), res);
	});
}

function _output(data, response) {
	response.writeHead(200, {'Content-Type': 'application/json'});
	response.write(data);
	response.close();
}