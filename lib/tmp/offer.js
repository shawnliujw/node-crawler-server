
exports.format = function(offerText) {
	return offerText ?
		offerText.replace(/[\t\n\x0B\f\r]/g, "").trim() : "";
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

/**
 * remove offer that not real offer, 
 * @param {type} offer
 * @param {type} keywords , it can be array if there are multiply keywords
 * @returns {undefined}
 */
exports.filter = function(offers, keywords) {
	var newOffers = [];
	if (keywords || offers) {
		if (!Array.isArray(keywords)) {
			keywords = [keywords];
		}
		if (!Array.isArray(offers)) {
			offers = [offers];
		}
		offers.forEach(function(offer) {
			keywords.forEach(function(key) {
				if (offer.toLowerCase().indexOf(key.toLowerCase()) === -1) {
					newOffers.push(offer);
				}
			});
		});
		newOffers = newOffers.length===0 ? "" : (newOffers.length === 1 ? newOffers[0] : newOffers);
	} else {
		newOffers = offers;
	}
	return newOffers;
};
