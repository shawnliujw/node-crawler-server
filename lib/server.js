var path = require("path");
process.env.NODE_CONFIG_DIR = path.join(__dirname, "..//config");
var logger = require("log4js").getLogger("lib/server.js");
var Promise = require("bluebird");
var childProcess = require('child_process');
var binPath = /^win/.test(process.platform) ? "casperjs.bat" : "casperjs";
var config = require("config");
var async = require("async");
var util = require('util');
var monitor = require("./monitor");
var casperPorts = config.casper.ports;

var portStatus = {};

// 1. no server run this port ,will create new one
// 2. if there exist process running on this port ,
//    will stop it and recreate one , just in case port is listening but no resposne. 
var createChildServer = function(port) {
	return killServerOnPort(port)
			.then(function() {
				var childArgs = [
					"--ssl-protocol=any", // avoid "SSL handshake failed"
					path.join(__dirname, "./casperjs-server.js"),
					JSON.stringify({"port": port})
				];

				var options = {};
				options.env = process.env;
				if (config.casper && config.casper.logLevel) {
					util._extend(options.env, {'CASPER_LOG_LEVEL': config.casper.logLevel});
					util._extend(options.env, {'CASPER_LOG_FILE': config.casper.logFile});
				}

				logger.info("Create casperjs server on port:" + port);
				var ps = childProcess.spawn(binPath, childArgs, options);
				ps.stdout.on('data', function(data) {
					portStatus[port] = true;
					data = data.toString();
					if (data && data.indexOf("Fatal") !== -1) {
						logger.error("Phantomjs stdout:", data);
					} else {
						logger.debug("Phantomjs stdout:", data);
					}
				});

				ps.stderr.on('data', function(data) {
					logger.error("Phantomjs stderr:", data.toString())
				});

				ps.on("error", function(msg) {
					logger.error("Phantomjs prcess error:", msg);
				});

				ps.on("exit", function(msg) {
					portStatus[port] = false;
					console.log("Phantomjs process exit with code:", msg);
				});
				return new Promise(function(resolve, reject) {
					setTimeout(function() {
						resolve(port);
					}, 1000);
				});
			});

};


function killServerOnPort(ports) {
	if (!Array.isArray(ports)) {
		ports = [ports];
	}
	return Promise.map(ports, function(port) {
		return new Promise(function(resolve, reject) {
			logger.info("kill port ", port);
			var command = "kill -9 $(netstat -tlnp|grep " + port + "|awk '{print $7}'|awk -F '/' '{print $1}')";
			childProcess.exec(command, function() {
				resolve();
			});
		});
	});

}

function ping(port) {
	return Promise(function(resolve, reject) {
		var url = "http://localhost:" + port;
		logger.info("Ping:" + url);
		var option = {
			url: url,
			timeout: config.healthCheck.pingTimeout
		};
		request(option, function(err, res, data) {
			if (err) {
				logger.info("No response from port:" + port);
				createChildServer(port);
				resolve({
					status: false
				});
			} else {
				logger.info("Server is running on port:" + port);
				resolve({
					status: true
				});
			}
		});
	});

}

function _get(port) {
	if (portStatus[port]) {
		return Promise.resolve(port);
	} else {
		return createChildServer(port);
	}
}

//exports.start = createChildServer;
exports.release = killServerOnPort;
exports.ping = ping;
exports.retrive = function() {
	var port = casperPorts.shift();
	casperPorts.push(port);
	return _get(port);
};



