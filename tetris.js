// John Supsupin, 2013, Village88.com - Tetrijs

function playTetris()
{
	var tetrisBox = document.getElementById("tetrisContainer");
	var block_shapes = ["block_i", "block_j", "block_l", "block_o", "block_s", "block_t", "block_z"]
	var default_game_speed = 400;
	//game speed and key presses
	var game_loop = null;
	var game_speed = default_game_speed;
	var current_key_pressed = null;
	var is_key_pressed = false;
	var game_score = 0;
	var combo_count = -1;
	var next_block_shape = null;
	var end_counter = 0;
	
	this.initialize = function()
	{
		grid = [];		
		//create tetris grid
		for(var y = 0; y < 21; y++){
			grid.push([0,1,2,3,4,5,6,7,8,9])
		}

		square_size = 22;
		//set grid values and tiles in the browser
		for(var y = 0; y < 21; y++){
			for(var x = 0; x < 10; x++){
				if(y === 20)
					grid[20][x] = null;
				else
					grid[y][x] = 1;

				if(y < 20 && x >= 0 && x <= 9)
					tetrisBox.innerHTML += '<div class="tetris_grid piece" style="top: '+ (y*square_size) +'px; left: '+ (x*square_size) +'px;"></div>';
			}
		}
		//get possible tetris pieces
		block_patterns = getTetrisPieces();
		resetMetrics();
	}

	renderBlock = function()
	{	
		var is_last_location = false; 
		var new_block_location = [];

		if(active_block_shape === null)
			active_block_shape = block_shapes[Math.floor(Math.random()*7)]
		
		//get possible location
		iterateBlock(function(block){
			if(block.display === 1)
				new_block_location.push([ parseInt(active_block_y) + block.y_coord , parseInt(active_block_x) + block.x_coord ]); 	
		});
		
		//get max possible location
		var highestX = 0, lowestX = 0, minimumX = 0; 
		var maximumX = 9;

		for(var i = 0; i < new_block_location.length; i++ ){
			var new_y = new_block_location[i][0]
			var new_x = new_block_location[i][1]

			if(grid[new_y] !== undefined){
				if(grid[new_y][new_x] === null){
					is_last_location = true;
					break;
				}
			}else{
				refreshRender();
			}

			if(new_x > highestX) highestX = new_x; // set the heighest end point of the current location
			if (new_x < lowestX) lowestX = new_x; // set the lowest end point of the current location

			if(i === 3){
				if(highestX <= maximumX && lowestX >= minimumX) // check if the heighest or lowest end point does not exceed to the maximum and minimum end point
					allowed_block_location.push(new_block_location);
				else{
					if(lowestX < 0) 
						active_block_x += 1;
					else if(highestX > 9) 
						active_block_x -= 1;
				}

				highestX = 0;
				lowestX = 0;
			}
		}
		
		//render block
		if(allowed_block_location.length > 0){
			end_counter = 0;
			var piece_to_display = "";
			
			for(var location_index = 0; location_index < allowed_block_location.length; location_index++){
				for(var coord_index = 0; coord_index < allowed_block_location[location_index].length; coord_index++){

					draw_y = allowed_block_location[location_index][coord_index][0]
					draw_x = allowed_block_location[location_index][coord_index][1]
					
					piece_to_display += '<div class="active_block piece landed_piece '+ active_block_color +'" style="top: '+ (draw_y * square_size) +'px; left: '+ (draw_x * square_size) +'px;"></div>';
					
					$("#tetrisContainer .active_block").remove();
					if(coord_index === 3){	
						tetrisBox.innerHTML += piece_to_display;
						piece_to_display ="";
					}
					
					if(location_index === (allowed_block_location.length -1) && is_last_location === true){ 
						grid[draw_y][draw_x] = null;

						if(coord_index === 3){
							refreshRender();
							var drop_sound = $('#drop');
							drop_sound.get(0).play();
						}
					}
				}
			}
		}
		else{
			end_counter += 1;
			refreshRender();
		}
	}

	iterateBlock = function(callback)
	{
		var selected_block = block_patterns[active_block_shape][active_block_rotation];

		for(var block_y in selected_block){	
			for(var block_x in selected_block[block_y]){
				callback({
					display: selected_block[block_y][block_x],
					y_coord: parseInt(block_y), 
					x_coord: parseInt(block_x)
				});
			}
		}
	}
	
	refreshRender = function()
	{
		for(var x = 0; x < 10; x++){
			if(grid[0][x] === null || end_counter > 2){
				gameOver();	

				setTimeout(function(){
					location.reload(true);
				}, 3000);

				break;
			}
		}	

		checkExplodeLine();	

		$(".active_block").removeClass("active_block");
		resetMetrics();

		game_speed = default_game_speed;
		clearGameLoop();
	}

	gameOver = function(){
		$.get('top_score.txt', function(top_score) {
	      if(game_score > parseInt(top_score))
	      {
	      	var player_name = "Unknown?";
	      	var new_player_name = prompt("New highest score! What's your name? ", player_name);
	
	      	$.post("write_score.php", { score: game_score, name: new_player_name }, function(data){}, "json");

	      	game_score = 0;
	      }
	    }, 'text');

		$("#tetrisContainer").html('<img style="width: 222px; top: 200px;"src="http://www.mobygames.com/images/shots/l/225902-tetris-zx-spectrum-screenshot-game-over-spectrum-128-s.png" alt=""><div><h3 id="game_restart">Game will restart!<h3></div>');
	}

	resetMetrics = function(){
		active_block_y = -1;	
		active_block_x = Math.floor(Math.random()*6);
		active_block_color = block_shapes[Math.floor(Math.random()*7)];
		allowed_block_location = [];
		active_block_rotation = Math.floor(Math.random()*3);
		active_block_shape = next_block_shape;

		landed = [];
		playground_layer = null;

		//show next piece
		next_block_shape = block_shapes[Math.floor(Math.random()*7)];
		
		var next_block_layout = "";
		var next_block = block_patterns[next_block_shape][0];

		for(var block_y in next_block){	
			for(var block_x in next_block[block_y]){
				if(next_block[block_y][block_x] === 1){
					next_block_layout += '<div class="piece '+ next_block_shape +'" style="top: '+ (block_y * square_size) +'px; left: '+ (block_x * square_size) +'px;"></div>';	
				}
			}
		}

		$("#next_shape").html(next_block_layout);
	}

	this.moveBlock = function(keyCode)
	{	
		if(active_block_y < 0){
			return false;
		}

		// left arrow
		if(keyCode === 37)
			active_block_x -= 1;
		// right arrow
		if(keyCode === 39)
			active_block_x += 1;

		// up arrow
		if(keyCode === 38){
			if(active_block_rotation < 3)
				active_block_rotation += 1;
			else
				active_block_rotation = 0;

			var rotate_sound = $('#rotate');
			rotate_sound.get(0).play();
		}
		// down arrow 
		if(keyCode === 40){ 
			game_speed = 50;
			clearGameLoop();
		}
		// space
		if(keyCode === 32){ 
			game_speed = -1000;
			clearGameLoop();
		}

		is_key_pressed = true;
		current_key_pressed = keyCode;
	}

	fallActiveBlock = function(){
		game_loop = setInterval(function(){
			if((current_key_pressed === 37 || current_key_pressed === 39) && is_key_pressed === true){
				is_key_pressed = false;
			}
			else{
				active_block_y += 1;
				is_key_pressed = false;
			}

			renderBlock();
		}, game_speed);
	}

	checkExplodeLine = function(){
		var removed_line = 0;

		for(var y = 19; y > 0; y--){
			
			for(var x = 0; x < 10; x++){
				if(grid[y][x] === null)
					landed.push(x);
			}

			if(landed.length === 10)
			{
				combo_count += 1;
				landed = [];

				flooring_layer = grid.slice(20, 21);
				playground_layer = grid.slice(0, 20)

				//playground_layer.pop();
				playground_layer.splice(y, 1);
				playground_layer.unshift([1,1,1,1,1,1,1,1,1,1]);
				playground_layer.push(flooring_layer[0]);

				$("#tetrisContainer .landed_piece").remove();
				var boom_sound = $('#boom');
				boom_sound.get(0).play();

				var inactive_pieces = "";

				for(var y = 0; y < 20; y++){
					for(var x = 0; x < 10; x++){
						if(playground_layer[y][x] === null){
							inactive_pieces += '<div class="inactive_piece piece landed_piece" style="top: '+ (y*square_size) +'px; left: '+ (x*square_size) +'px;"></div>';
						}
					}
				}

				tetrisBox.innerHTML += inactive_pieces;
				inactive_pieces = "";

				grid = playground_layer;

				removed_line += 1;
			}
			else{
				landed = [];
				playground_layer = null;
			}
		}

		if(removed_line > 0){
			calculateScore(removed_line, combo_count);
		}
		else
			combo_count = -1;
	}

	calculateScore = function(removed_line){
		switch(removed_line){
			case 1:
				score = (removed_line * 100) + (combo_count * 50);
			break;
			case 2:
				score = (removed_line * 300) + (combo_count * 50);
			break;
			case 3:
				score = (removed_line * 500) + (combo_count * 50);
			break;
			case 4:
				score = (removed_line * 800) + (combo_count * 50);
			break;
		}
		
		game_score += score; 
		$("#score").html(game_score);
	}

	this.resetGameSpeed = function(){
		game_speed = default_game_speed;
		clearGameLoop();
	}

	clearGameLoop = function(){
		clearInterval(game_loop);
		fallActiveBlock();
	}

	this.mainLoop = function(){
		fallActiveBlock();
		block_shapes = block_shapes.shuffle();
	}

	getTetrisPieces = function(){
		return {
				"block_i": { 
					0: { 0: [0,0,0,0], 1: [1,1,1,1], 2: [0,0,0,0], 3: [0,0,0,0] },
					1: { 0: [0,0,1,0], 1: [0,0,1,0], 2: [0,0,1,0], 3: [0,0,1,0] },
					2: { 0: [0,0,0,0], 1: [0,0,0,0], 2: [1,1,1,1], 3: [0,0,0,0] },
					3: { 0: [0,1,0,0], 1: [0,1,0,0], 2: [0,1,0,0], 3: [0,1,0,0] }
				},
				"block_j": {
					0: { 0: [1,0,0,0], 1: [1,1,1,0], 2: [0,0,0,0], 3: [0,0,0,0] },
					1: { 0: [0,1,1,0], 1: [0,1,0,0], 2: [0,1,0,0], 3: [0,0,0,0] },
					2: { 0: [0,0,0,0], 1: [1,1,1,0], 2: [0,0,1,0], 3: [0,0,0,0] },
					3: { 0: [0,1,0,0], 1: [0,1,0,0], 2: [1,1,0,0], 3: [0,0,0,0] }
				},
				"block_l": {
					0: { 0: [0,0,1,0], 1: [1,1,1,0], 2: [0,0,0,0], 3: [0,0,0,0] },
					1: { 0: [0,1,0,0], 1: [0,1,0,0], 2: [0,1,1,0], 3: [0,0,0,0] },
					2: { 0: [0,0,0,0], 1: [1,1,1,0], 2: [1,0,0,0], 3: [0,0,0,0] },
					3: { 0: [1,1,0,0], 1: [0,1,0,0], 2: [0,1,0,0], 3: [0,0,0,0] }
				},
				"block_o": {
					0: { 0: [0,1,1,0], 1: [0,1,1,0], 2: [0,0,0,0], 3: [0,0,0,0] },
					1: { 0: [0,1,1,0], 1: [0,1,1,0], 2: [0,0,0,0], 3: [0,0,0,0] },
					2: { 0: [0,1,1,0], 1: [0,1,1,0], 2: [0,0,0,0], 3: [0,0,0,0] },
					3: { 0: [0,1,1,0], 1: [0,1,1,0], 2: [0,0,0,0], 3: [0,0,0,0] }
				},
				"block_s": { 
					0: { 0: [0,1,1,0], 1: [1,1,0,0], 2: [0,0,0,0], 3: [0,0,0,0] },
					1: { 0: [0,1,0,0], 1: [0,1,1,0], 2: [0,0,1,0], 3: [0,0,0,0] },
					2: { 0: [0,0,0,0], 1: [0,1,1,0], 2: [1,1,0,0], 3: [0,0,0,0] },
					3: { 0: [1,0,0,0], 1: [1,1,0,0], 2: [0,1,0,0], 3: [0,0,0,0] }  
				},
				"block_t": { 
					0: { 0: [0,1,0,0], 1: [1,1,1,0], 2: [0,0,0,0], 3: [0,0,0,0] },
					1: { 0: [0,1,0,0], 1: [0,1,1,0], 2: [0,1,0,0], 3: [0,0,0,0] },
					2: { 0: [0,0,0,0], 1: [1,1,1,0], 2: [0,1,0,0], 3: [0,0,0,0] },
					3: { 0: [0,1,0,0], 1: [1,1,0,0], 2: [0,1,0,0], 3: [0,0,0,0] }
				},
				"block_z": { 
					0: { 0: [1,1,0,0], 1: [0,1,1,0], 2: [0,0,0,0], 3: [0,0,0,0] },
					1: { 0: [0,0,1,0], 1: [0,1,1,0], 2: [0,1,0,0], 3: [0,0,0,0] },
					2: { 0: [0,0,0,0], 1: [1,1,0,0], 2: [0,1,1,0], 3: [0,0,0,0] },
					3: { 0: [0,1,0,0], 1: [1,1,0,0], 2: [1,0,0,0], 3: [0,0,0,0] }  
				}
			}
	}

	//custom function shuffle to shuffle a 1D javascript array
	Array.prototype.shuffle = function() {
		var s = [];
		while (this.length){ 
			s.push(this.splice(Math.random() * this.length, 1)[0]);
		} 
		while (s.length){
			this.push(s.pop());
		}
		return this;
	}

	this.initialize();
}