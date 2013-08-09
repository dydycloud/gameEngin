/*L'objet level contiendra toutes les infos sur les niveaux 
et des functions pour leurs gestions*/
var levels = {
	//information sur les niveaux
	data:[
		{ //1er niveau
			foreground:'desert-foreground',
			background:'clouds-background',
			entities:[
				{type:"ground", name:"dirt", x:500,y:440,width:1000,height:20,isStatic:true},
				{type:"ground", name:"wood", x:180,y:390,width:40,height:80,isStatic:true},
				 
				{type:"block", name:"wood", x:520,y:375,angle:90,width:100,height:25},
				{type:"block", name:"glass", x:520,y:275,angle:90,width:100,height:25},
				
				{type:"villain", name:"burger",x:520,y:200,calories:590},
				 
				{type:"block", name:"wood", x:620,y:375,angle:90,width:100,height:25},
				{type:"block", name:"glass", x:620,y:275,angle:90,width:100,height:25},
				
				{type:"villain", name:"fries", x:620,y:200,calories:420},

				{type:"hero", name:"orange",x:90,y:410},
				{type:"hero", name:"apple",x:150,y:410},
			]
		},
		{ //2er niveau
			foreground:'desert-foreground',
			background:'clouds-background',
			entities:[
				{type:"ground", name:"dirt", x:500,y:440,width:1000,height:20,isStatic:true},
				{type:"ground", name:"wood", x:180,y:390,width:40,height:80,isStatic:true},
				
				{type:"block", name:"wood", x:820,y:375,angle:90,width:100,height:25},
				{type:"block", name:"wood", x:720,y:375,angle:90,width:100,height:25},
				{type:"block", name:"wood", x:620,y:375,angle:90,width:100,height:25},
				{type:"block", name:"glass", x:670,y:310,width:100,height:25},
				{type:"block", name:"glass", x:770,y:310,width:100,height:25},
				 
				{type:"block", name:"glass", x:670,y:248,angle:90,width:100,height:25},
				{type:"block", name:"glass", x:770,y:248,angle:90,width:100,height:25},
				{type:"block", name:"wood", x:720,y:184,width:100,height:25},
				
				{type:"villain", name:"burger",x:715,y:148,calories:590},
				{type:"villain", name:"fries",x:670,y:400,calories:420},
				{type:"villain", name:"sodacan",x:765,y:395,calories:150},
				 
				{type:"hero", name:"strawberry",x:40,y:420},
				{type:"hero", name:"orange",x:90,y:410},
				{type:"hero", name:"apple",x:150,y:410},
			]
		},
	],

	//initialiser l'ecran de selection des niveaux
	init: function() {
		/*
		** on parcour l'array data et 
		** on genere dynamiquement un bouton pour chaques niveaux
		*/
		var html = "";
        for (var i=0; i < levels.data.length; i++) {
            var level = levels.data[i];
            html += '<input type="button" value="'+(i+1)+'">';
        };
        $('#levelselectscreen').html(html);
        
        //mais en place l'evenement click du bouton afin de charger  les niveaux
        $('#levelselectscreen input').click(function(){
            levels.load(this.value-1);
            $('#levelselectscreen').hide();
        });
	},

	// charger les infos et les images pour un niveau particulier
	load: function(number){
		//initialiser box2d quand on charge un niveau
		box2d.init();

		//declarer un nouvel objet currentlevel
		game.currentLevel = {number: number, hero:[]};
		game.scroe = 0;
		$('#score').html('Score: ' + game.score);
		game.currentHero = undefined;
		var level = levels.data[number];

		//charger le decor et la fronde
		game.currentLevel.backgroundImage = loader.loadImage("images/backgrounds/" + level.background + ".png");
		game.currentLevel.foregroundImage = loader.loadImage("images/backgrounds/" + level.foreground + ".png");

		game.slingshotImage = loader.loadImage("images/slingshot.png");
		game.slingshotFrontImage = loader.loadImage("images/slingshot-front.png");
		
		//chargement des entités
		for (var i=level.entities.length-1;i>=0;i--) {
			var entity = level.entities[i];
			entities.create(entity);
		};
		
		//appelé game.start quand les ressources sont chargées
		if (loader.loaded) {
			game.start()
		} else{
			loader.onload = game.start();
		}
	}
}
