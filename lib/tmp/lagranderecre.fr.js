var Price = require("./util/price");
var Offer = require("./util/offer");

exports.fetch = function(casper, timeout, callback) {
	var json = {"status": false};
	casper.waitUntilVisible("body", function() {
		try {
			var price = Price.format(casper.fetchText(".big-price"));//if there is no price , try fill postcode and retry to fetch price
			if (!price) {
//				casper.capture("1.png");
				casper.then(function() {
//					if (casper.exists("a.sbSelector")) {
//						casper.click("a.sbSelector");
//					} else {
//						casper.click("a.ajouter-liste-cadeau");
//					}
					casper.click(".productDetailsPanel");
				});
				casper.then(function() {
					casper.wait(3000, function() {
						try {
//							casper.capture("2.png");
							this.sendKeys('input#tags', '75008', {keepFocus: true});
							casper.wait(3000, function() {
//								casper.capture("3.png");
								this.then(function() {
									if (this.exists("ul.ui-autocomplete > li.ui-menu-item > a")) {
										this.mouse.doubleclick("ul.ui-autocomplete > li.ui-menu-item:nth-child(1) > a");
										casper.wait(6000, function() {
//											casper.capture("4.png");
											_fetchPrice(json, casper, timeout, callback);
										});
									} else {
										json.message = "failt to get store list after input postcode";
										json.status = false;
										callback(json);
									}
								});
							});
						} catch (e) {
							json.message = e.message;
							callback(json)
						}
					}, function() {
						json.message = "Wait timeout for page selector '#colorbox #cboxLoadedContent div.cmsimage img'";
						json.status = false;
						callback(json);
					}, timeout);
				});
			} else {
//				casper.capture("no.png");
				_fetchPrice(json, casper, timeout, callback);
			}
		} catch (e) {
			json.status = false;
			json.message = e.message;
			callback(json);
		}
	}, function onTimeout() {
		json.message = "Wait timeout for page selector 'body'";
		json.status = false;
		callback(json);
	}, timeout);
};

function _fetchPrice(json, casper, timeout, callback) {
	casper.waitUntilVisible("#page .productDetailsPanel", function() {
		try {//.outOfStockButton
			if (casper.exists("#page .productDetailsPanel .outOfStock")) {
				json.stock = "out-of-stock";
				json.status = true;
			} else if (casper.exists("#page .productDetailsPanel .addToCartButton")) {
				json.stock = "in-stock";
				json.status = true;
			} else {
				json.message = "stock error";
				json.status = false;
			}
			var price = casper.fetchText(".big-price");
			if (price) {
//				json.price1 = price;
				price = Price.format(price, 2);
				json.price_now = price;
			} else {
				json.message = "price error";
				json.status = false;
			}
			json.status = true;
		} catch (e) {
			json.status = false;
			json.message = e.message;
		}
		callback(json);
	}, function() {
		json.message = "Wait timeout for page selector '#page .productDetailsPanel'";
		json.status = false;
		callback(json);
	}, timeout);
}

exports.search = function(casper, timeout, callback) {
	var json = {"status": false};
	try {
		casper.waitUntilVisible("#artikel_grid", function() {
			casper.scrollToBottom();
			var products = casper.evaluate(function() {
				var nodes = document.querySelectorAll("#artikel_grid .artikel_grid_item h6.no_margin  a");
				var temp = new Array();
				for (var i = 0; i < nodes.length; i++) {
					temp.push({
						"name": nodes[i].innerText,
						"url": nodes[i].href
					});
				}
				return temp;
			});
			json.products = products;
			json.status = true;
			callback(json);
		}, function onTimeout() {
			callback(json);
		}, timeout);
	} catch (e) {
		json.message = e.message;
		callback(json);
	}
};