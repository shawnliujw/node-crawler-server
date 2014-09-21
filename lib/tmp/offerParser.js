
var patterns = require('./offerPatterns');
var extend = require('util-extend');

var Offer = function(offerText, unitPrice) {

	this.text = offerText;
	this.price = unitPrice * 100;

	this.wasPrice = (function() {
		var s = offerText.match(patterns.wasPrice);
		if (s) {
			return parsePrice(s[0]);
		}
	}());

	var match;
	var pattern;
	var matchPattern = null;
	for (pattern in patterns.offerTypes) {
		match = offerText.match(patterns.offerTypes[pattern]);
		if (match) {
			matchPattern = pattern;
			match = match[0];
			break;
		}
	}
	switch (matchPattern) {
		case '3.0':
			var MBB = parseMBB(match);
			this.quantity = MBB.quantity;
			break;
		case '2.0':
			var MBP = parseMBP(match, this.price);
			this.quantity = MBP.quantity;
			this.MBPprice = MBP.price;
			break;
		case '1.2':
			this.proportionalDiscount = parseProportionalDiscount(match);
			this.quantity = 1;
			break;
		case '1.1':
		case '1.3':
		case '1.0':
			this.quantity = 1;
	}
	this.type = (parseFloat(matchPattern, 10) || null);

};

Offer.prototype = extend(Offer.prototype, {

	priceDifference: function() {
		return (this.wasPrice - this.price);
	},

	savings: function(quantity) {
		var m = Math.floor(quantity / this.quantity);
		var offerPrice = m * this.MBPprice;
		var price = m * this.quantity * this.price;
		switch (this.attrs.offerType) {
			case 2.0:
				return (price - offerPrice) / 100 || 0;
			case 3.0:
				return m * this.price / 100 || 0;
			default:
				return quantity * (this.wasPrice - this.price) / 100;
		}
	},

	shortText: function() {
		switch (this.type) {
			case null:
				return '';
			case 3.0:
				return this.quantity + ' for ' + (this.quantity - 1);
			case 2.0:
				return this.quantity + ' for ' + formatIntPrice(this.MBPprice);
			case 1.3:
				return 'Half Price +';
			case 1.2:
				return 'Save 1/' + this.proportionalDiscount;
			case 1.1:
				return 'Half Price';
			default:
				return "Save " + formatIntPrice(this.priceDifference());
		}
	},

	mediumText: function() {
		switch (this.type) {
			case null:
				return '';
			case 3.0:
				return 'Buy ' + (this.quantity - 1) + ' get 1 free';
			case 2.0:
				return 'Buy ' + this.shortText();
			case 1.3:
				return 'Better than Half Price' + '. Was ' + formatIntPrice(this.wasPrice);
			default:
				return this.shortText() + '. Was ' + formatIntPrice(this.wasPrice);
		}
	},

	longText: function() {
		switch (this.type) {
			case null:
				return '';
			case 3.0:
			case 2.0:
				var savings = formatIntPrice(this.savings(this.quantity) * 100);
				return this.mediumText() + '. Save total of ' + savings;
			default:
				return this.mediumText() + ' now ' + formatIntPrice(this.price);
		}
	}

});

var formatIntPrice = function(int) {
	if (int < 100) {
		return int + 'p';
	}
	else if (int % 100 === 0) {
		return '£' + int / 100;
	}
	else {
		return '£' + (int / 100).toFixed(2);
	}
};

var sToInt = function(s) {
	var nums = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
	var int;
	nums.forEach(function(num, index) {
		if (s.toLowerCase().trim() === num) {
			int = index;
			return;
		}
	});
	return int;
};

var parsePrice = function(string) {
	var price = string.match(patterns.price)[0];
	return price.indexOf('.') === -1 && string.indexOf('£') === -1 ? price : price * 100;
};

var parseProportionalDiscount = function(string) {
	return string.match(patterns.integer)[1];
};

var parseAddSave = function(string, unitPrice) {
	var quantity = parseInt(string.match(patterns.integer)[0], 10);
	var savings = parsePrice(string.match(patterns.priceWithUnit)[0]);
	return {
		price: quantity * unitPrice - savings,
		quantity: quantity
	};
};

var parseMBP = function(string, unitPrice) {
	if (string.match(patterns.addSave)) {
		return parseAddSave(string, unitPrice);
	}
	return {
		price: parsePrice(string.match(patterns.priceWithUnit)[0]),
		quantity: parseInt(string.match(patterns.integer)[0], 10)
	};
};

var parseMBB = function(string) {
	var q = (string.match(patterns.integer)[0]);
	if (string.match(patterns.qforq)) {
		return {
			quantity: /\d+/.test(q) ? parseInt(q, 10) : sToInt(q)
		};
	} else {
		return {
			quantity: /\d+/.test(q) ? parseInt(q, 10) + 1 : sToInt(q) + 1
		};
	}
};

/**
 * parse offer text.
 * @param {String} offerText original offerText.
 * @param {Number} unitPrice discounted price.
 * @returns {offer}
 */

exports.parse = function(offerText, unitPrice) {


};

exports.format = function(offerText) {
	if (offerText) {
		offerText = offerText.replace(/[\t\n\x0B\f\r]/g, "").trim();
	} else {
		offerText = "";
	}
	return offerText;
};

exports.validity = function(str) {
	if (str) {
		try {
			str = str.replace(/[^\d\/-]/g, "");
			var date = new Date(str);
			str = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
		} catch (e) {
			str = null;
		}

	}
	return str;
};
