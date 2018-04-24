var stream;
var screenWidth = 800;
var screenHeight = 600;
var seaLevel = 500;
var time = 0;
var deltaTime = 0;

// render configure
var drawCenterMass = false;
var drawSpeedLine = true;
var drawNode = true;
var drawSpring = true;
var drawSeaLevelLine = false;
var drawParticles = false;

function getTime() {
  return millis() / 1000;
}

// this is called once on initialization
function setup() {
  createCanvas(screenWidth, screenHeight);
  stream = new ParticleStream();
}

// this is called every frame to update all variables
function draw() {
  background(51);
  deltaTime = getTime() - time;
  time += deltaTime;
  
  // handle input
  var v = createVector(0, 0);
  var moveSpeed = 5;
  if(keyIsDown(LEFT_ARROW)) {
    v.x -= moveSpeed;
  }
  if(keyIsDown(RIGHT_ARROW)) {
    v.x += moveSpeed;
  }
  if(keyIsDown(UP_ARROW)) {
    v.y -= moveSpeed;
  }
  if(keyIsDown(DOWN_ARROW)) {
    v.y += moveSpeed;
  }
  stream.move(v);
  if (v.x != 0 || v.y != 0) {
    stream.blowWind(v.mult(-1));
    stream.isMoving = true;
  }
  else {
    stream.isMoving = false;
  }

  stream.update();

  if(drawSeaLevelLine) drawSeaLevel();
}

function drawSeaLevel() {
  stroke(30);
  var i = 0;
  var a = 20;
  while(i < screenWidth) {
    line(i, seaLevel, i+a, seaLevel);
    i += 2*a;
  }
}

