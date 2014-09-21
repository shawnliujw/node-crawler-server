

var index = 0;

var Promise = function(dowork) {
	this.state = 0;
	this.id = index++;
	if (dowork) {
		try {
			dowork(this.resolve.bind(this), this.reject.bind(this));
		} catch (e) {
			this.reject(e);
		}
	}
};

Promise.prototype.resolve = function(data) {
	if (data && data instanceof Promise) {
		data.then(this.resolve.bind(this));
	} else if (this.state === 0) {
		this.state = 1;
		this.result = data;
		if (this.next) {
			this.next.execute(data);
		}
	}
	return this;
};

Promise.prototype.reject = function(error) {
	if (this.state === 0) {
		this.state = -1;
		this.error = error;
		if (this.errorHandler) {
			this.errorHandler(error);
		}
	}
	return this;
};

Promise.prototype.then = function(fn) {
	if (this.state === 1) {
		fn(this.result);
		return this;
	} else {
		this.next = new DelayedPromise(this, fn);
		return this.next;
	}
};

Promise.prototype.catch = function(fn) {
	if (this.state === -1) {
		fn(this.error);
	} else {
		this.errorHandler = fn;
	}
	return this;
};


var DelayedPromise = function(parent, fn) {
	this.parent = parent;
	this.worker = fn;
	this.id = index++;
	this.state = 0;
};

DelayedPromise.prototype.resolve = Promise.prototype.resolve;
DelayedPromise.prototype.reject = Promise.prototype.reject;
DelayedPromise.prototype.then = Promise.prototype.then;
DelayedPromise.prototype.catch = Promise.prototype.catch;

DelayedPromise.prototype.execute = function(data) {
	try {
		this.resolve(this.worker(data));
	} catch (e) {
		this.reject(e);
	}
};

Promise.resolve = function(data) {
	var pr = new Promise(function(resolve, reject) {
		resolve(data);
	});
	return pr;
};

Promise.reject = function(error) {
	var pr = new Promise(function(resolve, reject) {
		reject(error);
	});
	return pr;
};

Promise.all = function(promises) {
	var _pr = new Promise();
	var _count = promises.length;
	var _decrement = function() {
		_count--;
		if (!_count) {
			_pr.resolve();
		}
	};
	promises.forEach(function(pr) {
		pr.then(_decrement);
	});
	return _pr;
};

module.exports = Promise;

