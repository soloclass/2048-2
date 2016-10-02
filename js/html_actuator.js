// 32678, 65536, 131072, 262144
var HI_SQUARE=262144;

function HTMLActuator(tileUpdater) {
  this.tileContainer    = document.querySelector(".tile-container");
  this.scoreContainer   = document.querySelector(".score-container");
  this.bestContainer    = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.sharingContainer = document.querySelector(".score-sharing");
  this.tileUpdater = tileUpdater;
  
  this.score = 0;
}

HTMLActuator.prototype.actuate = function (grid, metadata) {
  var self = this;

  window.requestAnimationFrame(function () {
    self.clearContainer(self.tileContainer);

    grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function () {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function(container) {
	while (container.firstChild) {
		container.removeChild(container.firstChild);
	}
};

HTMLActuator.prototype.addTile = function(tile) {
	var self = this;

	var position = tile.previousPosition || {
		x : tile.x,
		y : tile.y
	};

	var x = self.generateTileHTML(tile, position);
	var wrapper = x.wrapper;
	var inner = x.inner;
	var classes = x.classes;
	
	if (tile.previousPosition) {
		// Make sure that the tile gets rendered in the previous position first
		window.requestAnimationFrame(function() {
			classes[2] = self.positionClass({
				x : tile.x,
				y : tile.y
			});
			self.applyClasses(wrapper, classes); // Update the position
		});
	} else if (tile.mergedFrom) {
		classes.push("tile-merged");
		this.applyClasses(wrapper, classes);

		// Render the tiles that merged
		tile.mergedFrom.forEach(function(merged) {
			self.addTile(merged);
		});
	} else {
		classes.push("tile-new");
		this.applyClasses(wrapper, classes);
	}

//	// Add the inner part of the tile to the wrapper
//	wrapper.appendChild(inner);

	// Put the tile on the board
	this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.updateTileValue = function(tile, update) {
	var position = { x : tile.x, y : tile.y };
	this.tileUpdater(tile, update);
	tile.value = update;
	var wrapper = this.generateTileHTML(tile, position).wrapper;
	this.tileContainer.appendChild(wrapper);
}

HTMLActuator.prototype.generateTileHTML = function(tile, position) {
	var wrapper = document.createElement("div");
	var inner = document.createElement("div");
	var positionClass = this.positionClass(position);

	// We can't use classlist because it somehow glitches when replacing classes
	var classes = [ "tile", "tile-" + tile.value, positionClass ];

	if (tile.value > HI_SQUARE)
		classes.push("tile-super");

	this.applyClasses(wrapper, classes);

	inner.classList.add("tile-inner");
	inner.textContent = tile.value;

	inner.addEventListener('click', cellclickhandler(this, tile));
	
	wrapper.appendChild(inner);

	return { wrapper: wrapper, inner : inner, classes: classes};
}

HTMLActuator.prototype.applyClasses = function(element, classes) {
	element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function(position) {
	return {
		x : position.x + 1,
		y : position.y + 1
	};
};

HTMLActuator.prototype.positionClass = function(position) {
	position = this.normalizePosition(position);
	return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function(score) {
	this.clearContainer(this.scoreContainer);

	var difference = score - this.score;
	this.score = score;

	this.scoreContainer.textContent = this.score;

	if (difference > 0) {
		var addition = document.createElement("div");
		addition.classList.add("score-addition");
		addition.textContent = "+" + difference;

		this.scoreContainer.appendChild(addition);
	}
};

HTMLActuator.prototype.updateBestScore = function(bestScore) {
	this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function(won) {
	var type = won ? "game-won" : "game-over";
	var message = won ? "You win!" : "Game over!";

	this.messageContainer.classList.add(type);
	this.messageContainer.getElementsByTagName("p")[0].textContent = message;

	this.clearContainer(this.sharingContainer);
	this.sharingContainer.appendChild(this.scoreTweetButton());
};

HTMLActuator.prototype.clearMessage = function() {
	// IE only takes one value to remove at a time.
	this.messageContainer.classList.remove("game-won");
	this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.scoreTweetButton = function() {
	var tweet = document.createElement("a");
	tweet.classList.add("twitter-share-button");
	tweet.setAttribute("href", "https://twitter.com/share");
	tweet.setAttribute("data-via", "gabrielecirulli");
	tweet.setAttribute("data-url", "http://git.io/2048");
	tweet.setAttribute("data-counturl", "http://gabrielecirulli.github.io/2048/");
	tweet.textContent = "Tweet";

	var text = "I scored " + this.score + " points at 2048, a game where you "
			+ "join numbers to score high! #2048game";
	tweet.setAttribute("data-text", text);

	return tweet;
};

function isValidUpdate(newval, tileval) {
	if (newval == tileval)
		return false;
	if (newval <= 0)
		return false;
	var arse = newval & (newval - 1);
	return (newval & (newval - 1)) == 0
}


function cellclickhandler(hta, tile) {
	return function(evt) {
		if (tile.value == null)
			return;
		
		var div = document.getElementById('celledit');
		var numberfield = document.getElementById('editnumber');
		var updatebutton = document.getElementById('updatenumber');
		
		var style = 'left: ' + (evt.clientX + 5) + '; top: ' + (evt.clientY + 5);
		div.setAttribute('class', 'editbox');
		div.setAttribute('style', style);		

		numberfield.value = tile.value;

		updatebutton.onclick = function() {
			var update = parseInt(numberfield.value);
			var doupdate = isValidUpdate(update, tile.value); 
			
			div.setAttribute('class', 'invisible');
			div.setAttribute("style", '');		
			
			if (doupdate)
				hta.updateTileValue(tile, update);	
		};
	};
}
