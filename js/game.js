// Initialisation du requestAnimationFrame et de cancelAnimationFrame qui seront utilisé dans le code 
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = 
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

$(window).load(function() {
	game.init();
});

//l'objet game contiendra toutes les functions de logique du jeux
var game = {
	/*
	** Initialisation de l'objet, 
	** Pré-chargement des ressources 
	** Affichage de l'ecran d'accueil
	*/
	init: function() {
		//initialisation des objets nécessaire pour la logique
		levels.init();
		loader.init();
		mouse.init();
		/* 
		** Masquer to les elements avec la class gamelayer
		** Affichage de l'ecran d'accueil
		*/
		$('.gamelayer').hide();
		$('#gamestartscreen').show();

		//recupéré le canvas et le context
		game.canvas = $('#gamecanvas')[0];
		game.context = game.canvas.getContext('2d');
	},
	/*
	** cette fonction masque l'ecran d'accueil 
	**  et affiche la selection des niveaux
	*/
	showLevelScreen: function() {
		$('.gamelayer').hide();
		$('#levelselectscreen').show('slow');
	},

	// Game Mode
	mode:"intro", 
    // Coordonnées X & Y de la fronde
	slingshotX:140,
    slingshotY:280,

    start:function(){
        $('.gamelayer').hide();
        // on affiche le canvas et le score
        $('#gamecanvas').show();
        $('#scorescreen').show();

        game.mode = "intro";    
        game.offsetLeft = 0;
		game.ended = false;
		game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
    },	

    // vitesse max de defilement en pixels par frames
	maxSpeed:3,
    //max & min offset pour le pannig (defilement)
    minOffset: 0,
    maxOffset: 300,

    //Offset courant pour le defilement
    offsetLeft: 0,

    //Score
    score: 0,

    //defilement image du centre vers newCenter
    panTo: function(newCenter) {
    	if (Math.abs(newCenter - game.offsetLeft - game.canvas.width/4) > 0 && game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset) {
    		var deltaX = Math.round((newCenter - game.offsetLeft - game.canvas.width/4)/2);
    		if (deltaX && Math.abs(deltaX) > game.maxSpeed) {
    			deltaX = game.maxSpeed*Math.abs(deltaX)/(deltaX);
    		}
    		game.offsetLeft += deltaX;
    	} else{
    		return true;
    	}

    	if (game.offsetLeft < game.minOffset) {
    		game.offsetLeft = game.minOffset;
    		return true;
    	} else if (game.offsetLeft > game.maxOffset){
    		game.offsetLeft = game.maxOffset;
    		return true;
    	}
    	return false;
    },
    
    countHerosAndVillains:function() {
        // body...
    }
	handlePanning: function() {
		if (game.mode == "intro") {
			if(game.panTo(700)){
				game.mode = "load-next-hero";
			}
		}

		if (game.mode == "wait-for-firing") {
			if (mouse.dragging) {
				game.panTo(mouse.x + game.offsetLeft)
			} else{
				game.panTo(game.slingshotX);
			}
		}
		if (game.mode == "load-next-hero") {
			game.mode = "wait-for-firing";
		}
		if (game.mode == "firing") {
			game.panTo(game.slingshotX);
		}
		if (game.mode == "fired") {

		}
	},

	animate:function(){
        // Animer le decor
        game.handlePanning();

        // Animer les personnages
        var currentTime = new Date().getTime();
        var timeStep;

        if (game.lastUpdateTime) {
            timeStep = (currentTime - game.lastUpdateTime)/1000;
        }

        game.lastUpdateTime = currentTime;

        //  dessiner le decor avec un effet parrallax
        game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
        game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);


        // desiner la fronde
        game.context.drawImage(game.slingshotImage,game.slingshotX-game.offsetLeft,game.slingshotY);

        //dessiner tous les éléments
        game.drawAllBodies();

        game.context.drawImage(game.slingshotFrontImage,game.slingshotX-game.offsetLeft,game.slingshotY);

        	if (!game.ended){
        	game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }	
    },

    drawAllBodies: function() {
        box2d.world.DrawDebugData();

        //on recupère la list des body dans le world box2d et on les dessines
        for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            var entity = body.GetUserData();

            if (entity) {
                entities.draw(entity, body.GetPosition(), body.GetAngle())
            }
        }
    }
}


