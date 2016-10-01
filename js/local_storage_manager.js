window.fakeStorage = {
	_data : {},

	setItem : function(id, val) {
		return this._data[id] = String(val);
	},

	getItem : function(id) {
		return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
	},

	removeItem : function(id) {
		return delete this._data[id];
	},

	clear : function() {
		return this._data = {};
	}
};

function LocalStorageManager() {
	this.bestScoreKey = "bestScore";
	this.gameStateKey = "gameState";
	this.saveStateKey = "saveState";
	this.lastStateKey = "lastState";
	this.noticeClosedKey = "noticeClosed";

	var supported = this.localStorageSupported();
	this.storage = supported ? window.localStorage : window.fakeStorage;
}

LocalStorageManager.prototype.localStorageSupported = function() {
	var testKey = "test";
	var storage = window.localStorage;

	try {
		storage.setItem(testKey, "1");
		storage.removeItem(testKey);
		return true;
	} catch (error) {
		return false;
	}
};

// Best score getters/setters
LocalStorageManager.prototype.getBestScore = function() {
	return this.storage.getItem(this.bestScoreKey) || 0;
};

LocalStorageManager.prototype.setBestScore = function(score) {
	this.storage.setItem(this.bestScoreKey, score);
};

// Game state getters/setters and clearing
LocalStorageManager.prototype.getGameState = function() {
	var stateJSON = this.storage.getItem(this.gameStateKey);
	return stateJSON ? JSON.parse(stateJSON) : null;
};

LocalStorageManager.prototype.setGameState = function(gameState) {
	var last = this.storage.getItem(this.gameStateKey);
	if (last)
		this.storage.setItem(this.lastStateKey, last);
	this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
};

LocalStorageManager.prototype.undo = function() {
	var stateJSON = this.storage.getItem(this.lastStateKey);
	this.storage.removeItem(this.lastStateKey);
	return stateJSON ? JSON.parse(stateJSON) : null;
};

LocalStorageManager.prototype.restoreGameState = function() {
	var stateJSON = this.storage.getItem(this.saveStateKey);
	return stateJSON ? JSON.parse(stateJSON) : null;
};

LocalStorageManager.prototype.saveGameState = function(gameState) {
	this.storage.setItem(this.saveStateKey, JSON.stringify(gameState));
};

LocalStorageManager.prototype.clearGameState = function() {
	this.storage.removeItem(this.gameStateKey);
	this.storage.removeItem(this.lastStateKey);
};

LocalStorageManager.prototype.setNoticeClosed = function(noticeClosed) {
	this.storage.setItem(this.noticeClosedKey, JSON.stringify(noticeClosed));
};

LocalStorageManager.prototype.getNoticeClosed = function() {
	return JSON.parse(this.storage.getItem(this.noticeClosedKey) || "false");
};
