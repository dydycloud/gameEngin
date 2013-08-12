// Initialisation du requestAnimationFrame et de cancelAnimationFrame qui seront utilisé dans le code 
// Setup requestAnimationFrame and cancelAnimationFrame for use in the game code
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

var game = {
    // Start initializing objects, preloading assets and display start screen
    init: function(){
        // Initialize objects   
        levels.init();
        loader.init();
        mouse.init();

        // Load All Sound Effects and Background Music
    
        //"Kindergarten" by Gurdonark
        //http://ccmixter.org/files/gurdonark/26491 is licensed under a Creative Commons license
        game.backgroundMusic = loader.loadSound('audio/gurdonark-kindergarten');

        game.slingshotReleasedSound = loader.loadSound("audio/released");
        game.bounceSound = loader.loadSound('audio/bounce');
        game.breakSound = {
            "glass":loader.loadSound('audio/glassbreak'),
            "wood":loader.loadSound('audio/woodbreak')
        };


        // Hide all game layers and display the start screen
        $('.gamelayer').hide();
        $('#gamestartscreen').show();

        //Get handler for game canvas and context
        game.canvas = document.getElementById('gamecanvas');
        game.context = game.canvas.getContext('2d');
    },    
    startBackgroundMusic:function(){
        var toggleImage = $("#togglemusic")[0]; 
        game.backgroundMusic.play();
        toggleImage.src="images/icons/sound.png";   
    },
    stopBackgroundMusic:function(){
        var toggleImage = $("#togglemusic")[0]; 
        toggleImage.src="images/icons/nosound.png"; 
        game.backgroundMusic.pause();
        game.backgroundMusic.currentTime = 0; // Go to the beginning of the song
    },
    toggleBackgroundMusic:function(){
        var toggleImage = $("#togglemusic")[0];
        if(game.backgroundMusic.paused){
            game.backgroundMusic.play();
            toggleImage.src="images/icons/sound.png";
        } else {
            game.backgroundMusic.pause();   
            $("#togglemusic")[0].src="images/icons/nosound.png";
        }
    },
    showLevelScreen:function(){
        $('.gamelayer').hide();
        $('#levelselectscreen').show('slow');
    },
    restartLevel:function(){
        window.cancelAnimationFrame(game.animationFrame);       
        game.lastUpdateTime = undefined;
        levels.load(game.currentLevel.number);
    },
    startNextLevel:function(){
        window.cancelAnimationFrame(game.animationFrame);       
        game.lastUpdateTime = undefined;
        levels.load(game.currentLevel.number+1);
    },
    // Game Mode
    mode:"intro", 
    // X & Y Coordinates of the slingshot
    slingshotX:140,
    slingshotY:280,
    start:function(){
        $('.gamelayer').hide();
        // Display the game canvas and score 
        $('#gamecanvas').show();
        $('#scorescreen').show();
    
        game.startBackgroundMusic();
    
        game.mode = "intro";    
        game.offsetLeft = 0;
        game.ended = false;
        game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
    },  

    

    // Maximum panning speed per frame in pixels
    maxSpeed:3,
    // Minimum and Maximum panning offset
    minOffset:0,
    maxOffset:300,
    // Current panning offset
    offsetLeft:0,
    // The game score
    score:0,

    //Pan the screen to center on newCenter
    panTo:function(newCenter){
        if (Math.abs(newCenter-game.offsetLeft-game.canvas.width/4)>0 
            && game.offsetLeft <= game.maxOffset && game.offsetLeft >= game.minOffset){
        
            var deltaX = Math.round((newCenter-game.offsetLeft-game.canvas.width/4)/2);
            if (deltaX && Math.abs(deltaX)>game.maxSpeed){
                deltaX = game.maxSpeed*Math.abs(deltaX)/(deltaX);
            }
            game.offsetLeft += deltaX; 
        } else {
            
            return true;
        }
        if (game.offsetLeft <game.minOffset){
            game.offsetLeft = game.minOffset;
            return true;
        } else if (game.offsetLeft > game.maxOffset){
            game.offsetLeft = game.maxOffset;
            return true;
        }       
        return false;
    },
    countHeroesAndVillains:function(){
        game.heroes = [];
        game.villains = [];
        for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            var entity = body.GetUserData();
            if(entity){
                if(entity.type == "hero"){              
                    game.heroes.push(body);         
                } else if (entity.type =="villain"){
                    game.villains.push(body);
                }
            }
        }
    },
    mouseOnCurrentHero:function(){
        if(!game.currentHero){
            return false;
        }
        var position = game.currentHero.GetPosition();
        var distanceSquared = Math.pow(position.x*box2d.scale - mouse.x-game.offsetLeft,2) + Math.pow(position.y*box2d.scale-mouse.y,2);
        var radiusSquared = Math.pow(game.currentHero.GetUserData().radius,2);      
        return (distanceSquared<= radiusSquared);   
    },
    handlePanning:function(){
        if(game.mode=="intro"){     
            if(game.panTo(700)){
               game.mode = "load-next-hero";
            }            
        }      

        if (game.mode=="wait-for-firing"){  
            if (mouse.dragging){
                if (game.mouseOnCurrentHero()){
                    game.mode = "firing";
                } else {
                    game.panTo(mouse.x + game.offsetLeft)
                }
            } else {
                game.panTo(game.slingshotX);
            }
        }

        if (game.mode == "firing"){  
            if(mouse.down){
                game.panTo(game.slingshotX);                
                game.currentHero.SetPosition({x:(mouse.x+game.offsetLeft)/box2d.scale,y:mouse.y/box2d.scale});
            } else {
                game.mode = "fired";
                game.slingshotReleasedSound.play();                             
                var impulseScaleFactor = 0.75;
                
                // Coordinates of center of slingshot (where the band is tied to slingshot)
                var slingshotCenterX = game.slingshotX + 35;
                var slingshotCenterY = game.slingshotY+25;
                var impulse = new b2Vec2((slingshotCenterX -mouse.x-game.offsetLeft)*impulseScaleFactor,(slingshotCenterY-mouse.y)*impulseScaleFactor);
                game.currentHero.ApplyImpulse(impulse,game.currentHero.GetWorldCenter());

            }
        }

        if (game.mode == "fired"){      
            //pan to wherever the current hero is...
            var heroX = game.currentHero.GetPosition().x*box2d.scale;
            game.panTo(heroX);

            //and wait till he stops moving  or is out of bounds 
            if(!game.currentHero.IsAwake() || heroX<0 || heroX >game.currentLevel.foregroundImage.width ){
                // then delete the old hero
                box2d.world.DestroyBody(game.currentHero);
                game.currentHero = undefined;
                // and load next hero
                game.mode = "load-next-hero";
            }
        }
        

        if (game.mode == "load-next-hero"){
            game.countHeroesAndVillains();

            // Check if any villains are alive, if not, end the level (success)
            if (game.villains.length == 0){
                game.mode = "level-success";
                return;
            }

            // Check if there are any more heroes left to load, if not end the level (failure)
            if (game.heroes.length == 0){
                game.mode = "level-failure" 
                return;     
            }

            // Load the hero and set mode to wait-for-firing
            if(!game.currentHero){
                game.currentHero = game.heroes[game.heroes.length-1];
                game.currentHero.SetPosition({x:180/box2d.scale,y:200/box2d.scale});
                game.currentHero.SetLinearVelocity({x:0,y:0});
                game.currentHero.SetAngularVelocity(0);
                game.currentHero.SetAwake(true);                
            } else {
                // Wait for hero to stop bouncing and fall asleep and then switch to wait-for-firing
                game.panTo(game.slingshotX);
                if(!game.currentHero.IsAwake()){
                    game.mode = "wait-for-firing";
                }
            }
         }  
   
        if(game.mode=="level-success" || game.mode=="level-failure"){       
            if(game.panTo(0)){
                game.ended = true;                  
                game.showEndingScreen();
            }            
        }
    },
    
    showEndingScreen:function(){
        game.stopBackgroundMusic();             
        if (game.mode=="level-success"){            
            if(game.currentLevel.number<levels.data.length-1){
                $('#endingmessage').html('Level Complete. Well Done!!!');
                $("#playnextlevel").show();
            } else {
                $('#endingmessage').html('All Levels Complete. Well Done!!!');
                $("#playnextlevel").hide();
            }
        } else if (game.mode=="level-failure"){         
            $('#endingmessage').html('Failed. Play Again?');
            $("#playnextlevel").hide();
        }       

        $('#endingscreen').show();
    },
    
    animate:function(){
        // Animate the background
        game.handlePanning();

        // Animate the characters
            var currentTime = new Date().getTime();
            var timeStep;
            if (game.lastUpdateTime){
                timeStep = (currentTime - game.lastUpdateTime)/1000;
                if(timeStep >2/60){
                    timeStep = 2/60
                }
                box2d.step(timeStep);
            } 
            game.lastUpdateTime = currentTime;
    

        //  Draw the background with parallax scrolling
        game.context.drawImage(game.currentLevel.backgroundImage,game.offsetLeft/4,0,640,480,0,0,640,480);
        game.context.drawImage(game.currentLevel.foregroundImage,game.offsetLeft,0,640,480,0,0,640,480);

        // Draw the slingshot
        game.context.drawImage(game.slingshotImage,game.slingshotX-game.offsetLeft,game.slingshotY);

        // Draw all the bodies
        game.drawAllBodies();
    
        // Draw the band when we are firing a hero 
        if(game.mode == "wait-for-firing" || game.mode == "firing"){  
            game.drawSlingshotBand();
        }

        // Draw the front of the slingshot
        game.context.drawImage(game.slingshotFrontImage,game.slingshotX-game.offsetLeft,game.slingshotY);

        if (!game.ended){
            game.animationFrame = window.requestAnimationFrame(game.animate,game.canvas);
        }   
    },
    drawAllBodies:function(){  
        box2d.world.DrawDebugData();    

        // Iterate through all the bodies and draw them on the game canvas            
        for (var body = box2d.world.GetBodyList(); body; body = body.GetNext()) {
            var entity = body.GetUserData();
  
            if(entity){
                var entityX = body.GetPosition().x*box2d.scale;
                if(entityX<0|| entityX>game.currentLevel.foregroundImage.width||(entity.health && entity.health <0)){
                    box2d.world.DestroyBody(body);
                    if (entity.type=="villain"){
                        game.score += entity.calories;
                        $('#score').html('Score: '+game.score);
                    }
                    if (entity.breakSound){
                        entity.breakSound.play();
                    }
                } else {
                    entities.draw(entity,body.GetPosition(),body.GetAngle())                
                }   
            }
        }
    },
    drawSlingshotBand:function(){
        game.context.strokeStyle = "rgb(68,31,11)"; // Darker brown color
        game.context.lineWidth = 6; // Draw a thick line

        // Use angle hero has been dragged and radius to calculate coordinates of edge of hero wrt. hero center
        var radius = game.currentHero.GetUserData().radius;
        var heroX = game.currentHero.GetPosition().x*box2d.scale;
        var heroY = game.currentHero.GetPosition().y*box2d.scale;           
        var angle = Math.atan2(game.slingshotY+25-heroY,game.slingshotX+50-heroX);  
    
        var heroFarEdgeX = heroX - radius * Math.cos(angle);
        var heroFarEdgeY = heroY - radius * Math.sin(angle);
    
    
    
        game.context.beginPath();
        // Start line from top of slingshot (the back side)
        game.context.moveTo(game.slingshotX+50-game.offsetLeft, game.slingshotY+25);    

        // Draw line to center of hero
        game.context.lineTo(heroX-game.offsetLeft,heroY);
        game.context.stroke();      
    
        // Draw the hero on the back band
        entities.draw(game.currentHero.GetUserData(),game.currentHero.GetPosition(),game.currentHero.GetAngle());
            
        game.context.beginPath();       
        // Move to edge of hero farthest from slingshot top
        game.context.moveTo(heroFarEdgeX-game.offsetLeft,heroFarEdgeY);
    
        // Draw line back to top of slingshot (the front side)
        game.context.lineTo(game.slingshotX-game.offsetLeft +10,game.slingshotY+30)
        game.context.stroke();
    },

}

