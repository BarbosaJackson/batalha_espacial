( function (){
	// canvas
	var cnv = document.querySelector('canvas');
	// Contexto de renderização 2d
	var ctx = cnv.getContext('2d');

	// Recursos do jogo -----------------------------------

	// Arrays
	var sprites = [];
	var assetsToLoad = [];
	var misseles = [];
	var aliens = [];
	var messages = [];
	// sprites

	// variaveis uteis
	var alienFrequency = 100;
	var alienTimer = 0;
	var scorePoints = 0;

	// cenário
	var background = new Sprite(0, 56, 400, 500, 0, 0);
	sprites.push(background);

	// nave

	var black_star = new Sprite(0, 0, 30, 50, 185, 450);
	sprites.push(black_star);

	// mensagens
	var startMessager = new ObjectMessage(cnv.height/2, "PRESS ENTER", "#f00");
	messages.push(startMessager);
	
	var pauseMessage = new ObjectMessage(cnv.height/2, "PAUSED", "#f00");
	pauseMessage.isVisible = false;
	messages.push(pauseMessage);
	
	var gameOver = new ObjectMessage(cnv.height/2, "GAME OVER", "#f00");
	gameOver.isVisible = false;
	messages.push(gameOver);
	
	var restartMessage =  new ObjectMessage((cnv.height/2)+50, "RESTART?", "#f00");
	restartMessage.isVisible = false;
	messages.push(restartMessage);

	var restartInfo = new ObjectMessage(((cnv.height/2)+100), "PRESS ENTER", "#f00");
	restartInfo.isVisible = false;
	messages.push(restartInfo);

	var score = new ObjectMessage(20, scorePoints, "#f00");
	messages.push(score);

	// Imagem
	var img = new Image();
	img.addEventListener('load', loadHandler, false);
	img.src = "imgs/img.png";
	assetsToLoad.push(img);

	// Contador de recursos
	var loadedAssets = 0;

	//Entradas
	var LEFT = 37, RIGHT = 39, ENTER = 13, SPACE = 32;

	// Ações 
	var mvLeft = false, mvRight = false;
	var shoot = false, spaceIsDown = false;

	// estados do jogo
	var LOADING = 0, PLAYING = 1, PAUSED = 2, OVER = 3;
	var gameState = LOADING;

	// Listeners
	window.addEventListener('keydown', function(e){
		var key = e.keyCode;
		switch(key){
			case LEFT:
			mvLeft = true;
			break;
			case RIGHT:
			mvRight = true;
			break;
			case ENTER:
			break;
			case SPACE:
			if(!spaceIsDown && gameState == PLAYING){
				shoot = true;
				spaceIsDown = true;
			}
			break;
		}
	}, false);
	window.addEventListener('keyup', function(e){
		var key = e.keyCode;
		switch(key){
			case LEFT:
			mvLeft = false;
			break;
			case RIGHT:
			mvRight = false;
			break;
			case ENTER:
			if(gameState === OVER){
				document.location.reload(true);
			} else if(gameState !== PLAYING){
				gameState = PLAYING;
				startMessager.isVisible = false;
				pauseMessage.isVisible = false;
			} else {
				gameState = PAUSED;
				pauseMessage.isVisible = true;
			}
			break;
			case SPACE:
			spaceIsDown = false;
			break;
		}
	}, false)

	// Funções ---------------------

	function loadHandler(){
		loadedAssets++;
		if(loadedAssets === assetsToLoad.length){
			img.removeEventListener('load', loadHandler, false);
			gameState = PAUSED;
		}
	}

	function loop(){
		requestAnimationFrame(loop, cnv);
		switch(gameState){
			case LOADING:
			console.log('loanding...');
			break;
			case PLAYING:
			update();
			break;
		}
		render();
	}
	function update(){
		// move para esquerda, direita e para a nave
		if(mvLeft && !mvRight){
			black_star.vx = -5;
		} else if(mvRight && !mvLeft){
			black_star.vx = 5;
		} else if(!mvLeft && !mvLeft){
			black_star.vx = 0;
		}

		// Dispara o canhão
		if(shoot){
			fireMissile();
			shoot = false;
		}

		// Atualiza a posição da nave
		black_star.x = Math.max(0, Math.min((cnv.width-black_star.width), (black_star.x + black_star.vx)));

		// atualização da posição dos mísseis
		for(var i in misseles){
			var m = misseles[i];
			m.y += m.vy;
			if(m.y < m.height){
				removeObjects(m, misseles);
				removeObjects(m, sprites);
				i--;
			}
		}
		// incremento do alienTimer
		alienTimer++;

		// criação dos aliens
		if(alienFrequency == alienTimer){
			makeAlien();
			alienTimer = 0;
			// verifica a frequencia dos aliens, de forma que sempre seja "possivel" destrui-los
			
			if(alienFrequency > 30){
				alienFrequency--;
			} else {
				if(scorePoints < 50){
					alienFrequency = Math.floor(Math.random() * 11) + 50;
				} else if(scorePoints < 100){
					alienFrequency = Math.floor(Math.random() * 11) + 40;
				} else if(scorePoints < 200){
					alienFrequency = Math.floor(Math.random() * 11) + 30;
				} else {
					alienFrequency = Math.floor(Math.random() * 11) + 20;	
				}
			}
		}
		// move os aliens

		for (var i in aliens){
			var a = aliens[i];
			if(a.state !== a.EXPLODED){
				a.y += a.vy;
				if(a.state === a.CRAZY){
					if(a.x > cnv.width-a.width || a.x < 0){
						a.vx *= -1;
					}
					a.x += a.vx;
				}
			}
			// confere se algum alien chegou à Terra
			if(a.y > cnv.height + a.height ){
				gameState = OVER;
				gameOver.isVisible = true;
				restartMessage.isVisible = true;
				restartInfo.isVisible = true;
			}
			
			// confere se algum alien foi destruido
			for(var j in misseles){
				var m = misseles[j];
				if(collide(m, a)){
					destroyAlien(a);
					removeObjects(m, misseles);
					removeObjects(m, sprites);
					j--;
					i--;
					score.updateScorePoints(++scorePoints);
				}
			}
		}// fim da movimentação dos aliens
		for(var i in aliens){
			var a = aliens[i];
			if(collide(a, black_star)){
				gameState = OVER;
				gameOver.isVisible = true;
				restartMessage.isVisible = true;
				restartInfo.isVisible = true;
			}
		}
	}	

	// criação dos misseis
	function fireMissile(){
		var missile = new Sprite(136, 12, 8, 13, (black_star.centerX()-4), (black_star.y-13));
		missile.vy = -8;
		sprites.push(missile);
		misseles.push(missile);
	}
	// remover objetos do jogo
	function removeObjects(objToRemove, array){
		var i = array.indexOf(objToRemove);
		if(i !== -1){
			array.splice(i, 1);
		}
	}
	// destroi os aliens
	function destroyAlien(alien){
		alien.state = alien.EXPLODED;
		alien.explode();
		setTimeout(function(){
			removeObjects(alien, aliens);
			removeObjects(alien, sprites);
		}, 150);
	}

	// criação dos aliens

	function makeAlien(){
		// cria um valor aleatorio entre 0 e 7(largura do canvas / largura do alien)
		// divide o canvas em 8 colunas para o posicionamento aleatorio do alien
		var alienPosition = (Math.floor(Math.random() * 8) * 50);
		var alien = new Alien(30, 0, 50, 50, alienPosition, -50);
		alien.vy = 1;
		
		// Otimização do alien
		if(Math.floor(Math.random() * 11) > 7){
			alien.state = alien.CRAZY;
			alien.vx = 2;
		}

		if(Math.floor(Math.random() * 11) > 5){
			alien.vy = 2;
		}

		sprites.push(alien);
		aliens.push(alien);
	}
	function render(){
		ctx.clearRect(0, 0, cnv.width, cnv.height);
		// Exibe os sprites
		if(sprites.length !== 0){
			for(var i in sprites){
				var spr = sprites[i];
				ctx.drawImage(img, spr.sourceX, spr.sourceY, spr.width, spr.height, Math.floor(spr.x), Math.floor(spr.y), spr.width, spr.height);

			}
		}
		// Exibe os textos
		if(messages.length !== 0){
			for(var j in messages){
				var t = messages[j];
				if(t.isVisible){
					ctx.font = t.font;
					ctx.fillStyle = t.color;
					ctx.textBaseline = t.baseline;
					t.x = (cnv.width-ctx.measureText(t.text).width)/2;
					ctx.fillText(t.text, t.x, t.y);
				}
			}
		}
	}

	loop();

}());