var path = require("path");
process.env.NODE_CONFIG_DIR = path.join(__dirname, "../../config");
var sinon = require('sinon');
var expect = require("chai").expect;
var server = require('../..//lib/server');
var config = require("config");
var casperPorts = config.casper.ports;
var Promise = require("bluebird");
describe('Operate casper server', function() {

	beforeEach(function() {
		console.log("before")
		server.setUp();
	});

	it("#setUp()", function(done) {
		Promise.map(casperPorts, function(port) {
			return server.ping(port)
					.then(function(res) {
						console.log(res);
						expect(res.status).to.equal(true);
					});
		})
		.then(function() {
			done();
		})
		.catch(function() {
			done();
		});
	});

	it("#retrive()", function(done) {
		server.retrive(casperPorts[0])
				.then(function(port) {
					return server.ping(port)
							.then(function(res) {
								expect(res.status).to.equal(true);
							})
				}).then(function() {
					done();
				})
				.catch(function() {
					done();
				});
	});
	
	it("#releaseAll()",function(done){
		server.releaseAll()
				.then(function(){
					return Promise.map(casperPorts, function(port) {
								return server.ping(port)
										.then(function(res) {
											console.log(res);
											expect(res.status).to.equal(false);
										});
							})
				}).then(function() {
							done();
						})
				.catch(function() {
					done();
				});
	});
});

