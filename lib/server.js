'use strict';
var path = require("path");
var logger = require("log4js").getLogger("lib/server.js");
var Promise = require("bluebird");
var childProcess = require('child_process');
var binPath = /^win/.test(process.platform) ? "casperjs.bat" : "casperjs";
var config = require("../config");
var async = require("async");
var util = require('util');
var monitor = require("./monitor");
var casperPorts = config.casper.ports;
var request = require("request");

var portStatus = {};
// 1. no server run this port ,will create new one
// 2. if there exist process running on this port ,
//    will stop it and recreate one , just in case port is listening but no resposne. 
var createChildServer = function(port) {
	return new Promise(function(resolve, reject) {
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
		var ps = childProcess.spawn(binPath, childArgs, options);
		ps.stdout.on('data', function(data) {
			portStatus[port] = true;
			data = data.toString();
			if (data && data.indexOf("Fatal") !== -1) {
				logger.error(data);
			} else {
				logger.debug(data);
			}
		});
		ps.stderr.on('data', function(data) {
			logger.error( data.toString());
		});

		ps.on("error", function(msg) {
			logger.warn("Casper server occour error:",msg);
		});

		ps.on("exit", function(msg) {
			portStatus[port] = false;
			console.error("Casper exit with code:",msg);
		});
		var count = 0;
		async.until(
				function() {
					return portStatus[port] || count > 5;
				},
				function(callback) {
					count++;
					setTimeout(callback, 500);
				},
				function(err) {
					if (portStatus[port]) {
						logger.info("Create new casper server on port:", port);
						resolve(port);
					} else {
						logger.error("Failed to create server on port:", port);
						logger.error(err);
						reject(port);
					}
				}
		);
	});

};


function killServerOnPort(ports) {
	if (!Array.isArray(ports)) {
		ports = [ports];
	}
	return Promise.map(ports, function(port) {
		return new Promise(function(resolve, reject) {
			//var command = "kill -9 $(netstat -tlnp|grep " + port + "|awk '{print $7}'|awk -F '/' '{print $1}')";
			var command = "kill -9 $(lsof -t -i:" + port + ")";
			childProcess.exec(command, function(err) {
				portStatus[port] = false;
				logger.info("Clear proces on port ", port);
				resolve();
			});
		});
	});

}

function ping(port) {
	return new Promise(function(resolve, reject) {
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
exports.releaseAll = function() {
	var ports = config.casper.ports.filter(function(port) {
		return portStatus[port];
	});
	logger.info("Release ports:", ports);
	return killServerOnPort(ports);
};
exports.ping = ping;
exports.setUp = function() {
	logger.info("Setup casper instances");
	var ports = casperPorts.filter(function(port) {
		return !portStatus[port];
	});
	killServerOnPort(ports);

	if (ports && ports.length > 0) {
		return Promise.map(ports, function(port) {

			return createChildServer(port)
					.then(function() {
						monitor.setUp(port);
					})
					.catch(function(err) {
						return port;//failed to create server , TODO
					});
		});
	} else {
		return Promise.resolve();
	}
};
exports.retrive = function() {
	var port = casperPorts.shift();
	casperPorts.push(port);
	return _get(port);
};




