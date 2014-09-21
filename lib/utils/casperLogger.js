// Simple CasperJS logger
// Usage: 
// 		var Logger = require('./casperLogger')
// 		var logger = new Logger('<logFilePath>');
// 		logger.debug('Some debugging string');
var system = require('system');
var fs = require('fs');

var Logger = function (file) {
	var logLevel = null;

	var levels = {
		'DEBUG': 10,
		'INFO': 100,
		'ERROR': 1000
	};

	if (system.env.CASPER_LOG_LEVEL) {
		var passedLevel = system.env.CASPER_LOG_LEVEL.toUpperCase();
		if (levels[passedLevel]) {
			logLevel = passedLevel;
		}
	}

	var log = function (level, message) {
		if (!logLevel || levels[logLevel] > levels[level]) {
			return;
		}

		var logMsg = '[' + (new Date()).toISOString() + '] [' + level + '] ' + message + '\n';
		fs.write(file, logMsg, 'a');
	};

	this.info = function (message) { log('INFO', message); };
	this.debug = function (message) { log('DEBUG', message); };
	this.error = function (message) { log('ERROR', message); };
};

module.exports = Logger;