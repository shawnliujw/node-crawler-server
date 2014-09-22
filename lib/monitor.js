'use strict';
var logger = require("log4js").getLogger("monitor.js");
var config = require("../config");
var request = require("request");
var cronJob = require('cron').CronJob;
var os = require("os");
var casperServer = require("./server");
var Promise = require("bluebird");

var _memoryCheck = function() {
	var totalM = os.totalmem();
	var freeM = os.freemem();
	if ((freeM / totalM) < 0.1) {
		logger.info("Only have " + freeM / (1024 * 1024) + "M memory left, restart all casper servers");
		casperServer.release(config.casper.ports);
	}
};

exports.setUp = function(port) {
	var job = new cronJob({
		cronTime: config.healthCheck.pingCron,
		onTick: function() {
			casperServer.ping(port);
		},
		start: true
	});
	var job1 = new cronJob({
		cronTime: config.healthCheck.memoryCron,
		onTick: function() {
			_memoryCheck();
		},
		start: true
	});
	logger.info("Set up health check for port " + port);
};