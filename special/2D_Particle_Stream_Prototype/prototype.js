var stream;
var screenWidth = 800;
var screenHeight = 600;
var seaLevel = 500;
var time = 0;
var deltaTime = 0;

// render configure
var drawCenterMass = false;
var drawSpeedLine = false;
var drawNode = false;
var drawSpring = false;
var drawSeaLevelLine = false;

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


/////////////////////////////////////////////////////////////////////

function ParticleStream() {
  this.maxNodes = 7;
  this.nodes = [];
  this.springs = [];
  this.headMove = new p5.Vector(0, 0);
  this.cm = new p5.Vector(0, 0);
  this.cmVelocity = new p5.Vector(0, 0);
  this.isMoving = false;

  this.windCountDown = 0;
  this.windDuration = 1;
  this.windDir = new p5.Vector(0, 0);
  this.windIntensity = 200;

  // initialize nodes
  for (var i = 0; i < this.maxNodes; i++) {
    this.addNode(new SpringNode((i+1)*screenWidth / 10, seaLevel));
  }
  this.head = this.nodes[0]; // we can only control the head movement
  this.nodes[0].setHead(true);

  // initialize springs
  for (var i = 0; i < this.maxNodes - 1; i++) {
    var sp = new Spring((i+2)*10, (this.maxNodes-i)*30, 10, this.nodes[i], this.nodes[i+1]);
    this.springs.push(sp);
  }

  // initialize boids
  for (var i = 0; i < this.maxNodes; i++) {
    for (var j = 0; j < 10; j++) { // number of boids in a group
      var b = new Boid(this.nodes[i].position.x, this.nodes[i].position.y, this.nodes[i]);
      if (i === 0) {
        b.link(this.nodes[1].boids)
      }
      else if (i === this.maxNodes - 1) {
        b.link(this.nodes[i-1].boids);
      }
      else {
        b.link(this.nodes[i-1].boids);
        b.link(this.nodes[i+1].boids);
      }

      this.nodes[i].addBoid(b);
    }
  }
}

ParticleStream.prototype.addNode = function(n) {
  this.nodes.push(n);
}

ParticleStream.prototype.move = function(v) {
  this.headMove = v;
  this.head.translate(this.headMove);
}

ParticleStream.prototype.render = function() {
  if (drawCenterMass) {
    stroke(0, 200, 0);
    fill(0, 200, 0);
    ellipse(this.cm.x, this.cm.y, 15);
    if (drawSpeedLine) {
      line(this.cm.x, this.cm.y, 
        this.cmVelocity.x + this.cm.x, this.cmVelocity.y + this.cm.y);
    }
  }
}

ParticleStream.prototype.applyWind = function() {
  if (this.windCountDown > 0) {
    for (var i = 1; i < this.nodes.length; i++) {
      var scale = this.nodes.length - Math.abs(0.5 * this.nodes.length - i);
      scale *= (this.windCountDown / this.windDuration);
      this.nodes[i].applyForce(p5.Vector.mult(this.windDir.normalize(), scale * this.windIntensity));
      this.windCountDown -= deltaTime;
    }
  }
}

ParticleStream.prototype.blowWind = function(dir) {
  if (this.windCountDown <= 0) {
    this.windCountDown = this.windDuration; 
    this.windDir = dir;
  }
}


ParticleStream.prototype.applyFriction = function() {
  if (!this.isMoving) {
    for(var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].applyForce(p5.Vector.mult(this.nodes[i].velocity, -1));
    }
  }
}

ParticleStream.prototype.update = function() {
  // update center of mass
  this.cm.mult(0);
  for (var i = 0; i < this.nodes.length; i++) {
    this.cm.add(this.nodes[i].position);
  } 
  this.cm.div(this.nodes.length);

  this.cmVelocity.mult(0);
  for (var i = 0; i < this.nodes.length; i++) {
    this.cmVelocity.add(this.nodes[i].velocity);
  } 
  this.cmVelocity.div(this.nodes.length);

  this.applyWind();
  this.applyFriction();

  // first, update the springs, which will apply forces
  for (var i = 0; i < this.springs.length; i++) {
    this.springs[i].update();
  }

  // second, update nodes
  for (var i = 0; i < this.nodes.length; i++) {
    this.nodes[i].update();
  }

  this.render();
}


/////////////////////////////////////////////////////////////////////

function Spring(l, k1, k2, n1, n2) {
  this.originalLength = l;
  this.k_elastic = k1; // Hooke's law
  this.k_damp = k2;
  this.node1 = n1;
  this.node2 = n2;
  this.currLength = p5.Vector.mag(p5.Vector.sub(n1.position, n2.position)); // L=|r1 - r2|
  this.center = p5.Vector.add(n1.position, n2.position).div(2); // r_c = 0.5*(r1 + r2)
  this.maxLength = 30;
}

// apply elastic force to two nodes that the spring connects to
Spring.prototype.applyForce = function() {
  var f_elastic = -this.k_elastic * (this.currLength - this.originalLength); // Hooke's law: f = -k(x'-x)
  if (this.currLength < this.originalLength) f_elastic = 0;
  var dir = p5.Vector.sub(this.node1.position, this.center).normalize();
  var dv = p5.Vector.sub(this.node1.velocity, this.node2.velocity);
  var f_damp = p5.Vector.mult(dv, -this.k_damp); // f = -k(v1-v2) damped motion
  this.node1.applyForce(dir.mult(f_elastic));
  this.node1.applyForce(f_damp);

  dir = p5.Vector.sub(this.node2.position, this.center).normalize();
  this.node2.applyForce(dir.mult(f_elastic));
  this.node2.applyForce(f_damp.mult(-1));
}

Spring.prototype.render = function() {
  if (drawSpring) {
    stroke(0, 80, 240);
    line(this.node1.position.x, this.node1.position.y, this.node2.position.x, this.node2.position.y);
  }
}

Spring.prototype.update = function() {
  this.currLength = p5.Vector.mag(p5.Vector.sub(this.node1.position, this.node2.position));
  this.center = p5.Vector.add(this.node1.position, this.node2.position).div(2);
  this.applyForce();
  this.render();
}


/////////////////////////////////////////////////////////////////////

function SpringNode(x, y) {
  this.acceleration_last = createVector(0,0);
  this.acceleration_curr = createVector(0,0);
  this.position = createVector(x, y);
  this.velocity = createVector(0,0);

  this.maxspeed = 300;    // Maximum speed (dont know if necessary)
  this.maxforce = 150; // Maximum steering force (it is maximum acceleration if m=1)
  this.isHead = false;
  this.r = 5;  // render size
  this.time = 0;

  this.boids = [];
}

SpringNode.prototype.addBoid = function(b) {
  this.boids.push(b);
}

SpringNode.prototype.setHead = function(b) {
  this.isHead = b;
}

SpringNode.prototype.applyForce = function(force) {
  this.acceleration_curr.add(force);

  for (var i = 0; i < this.boids.length; i++) this.boids[i].applyForce(force); ///
}

// additional force to non-physically move the objects
SpringNode.prototype.applyGravity = function() {
  // sudo "gravity" to keep the particles near sea level
  var g = 1;
  this.applyForce(new p5.Vector(0, g * (seaLevel - this.position.y)));
}

SpringNode.prototype.applyMomentum = function(v) {
  // a sudden "kick" that transfer some momentum to node
  // and its velocity change instantly
  this.velocity.add(v);
}

// REMEMBER: js cannot overload operators!!!
// don't add or multiply vectors with +/*
// use p5.Vector.add(...)

// https://en.wikipedia.org/wiki/Leapfrog_integration
// kick-drift-kick form

SpringNode.prototype.move = function() {
  if (!this.isHead) {
    this.velocity.add(p5.Vector.mult(this.acceleration_last, 0.5 * deltaTime)); // v_{i+1/2} = v_i + 0.5*a_i dt 
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(p5.Vector.mult(this.velocity, deltaTime)); // x_{i+1} = x_i + v_{i+1/2}dt
    this.velocity.add(p5.Vector.mult(this.acceleration_curr, 0.5 * deltaTime));

    // save last acceleration
    this.acceleration_last.x = this.acceleration_curr.x;
    this.acceleration_last.y = this.acceleration_curr.y;
    // Reset current accelertion to 0 each cycle
    this.acceleration_curr.mult(0);
  }
}

// translate the position forcefully
// move the head along vector v, regardless of velocity and acceleration
SpringNode.prototype.translate = function(v) {
  if (this.isHead) {
    this.position.add(v);
    this.applyForce(p5.Vector.mult(v, 4000));
  }
}

SpringNode.prototype.render = function() {
  if (drawNode) {
  noFill();
  stroke(230, 180, 0);
  push();
  translate(this.position.x,this.position.y);
  beginShape();
  vertex(-this.r, -this.r);
  vertex(-this.r, this.r);
  vertex(this.r, this.r);
  vertex(this.r, -this.r);
  endShape(CLOSE);
  pop();

  if (drawSpeedLine) {
    stroke(200, 0, 200);
    line(this.position.x, this.position.y, 
      this.position.x + this.velocity.x, this.position.y + this.velocity.y);
  }
  }
}

SpringNode.prototype.update = function() {
  //this.applyGravity();
  this.move();
  this.render();

  for (var i = 0; i < this.boids.length; i++) {
    this.boids[i].update();
  }
}

/////////////////////////////////////////////////////////////////////

// Boid class
// Methods for Separation, Cohesion, Alignment added

function Boid(x,y,guideNode) {
  this.acceleration_last = createVector(0,0);
  this.acceleration_curr = createVector(0,0);
  this.velocity = createVector(random(-1,1),random(-1,1));
  this.position = createVector(x, y);
  this.r = 1.0;
  
  this.guide = guideNode; // 
  this.group1 = guideNode.boids; 
  this.group2 = []; // reference to an array of Boids that interacts with
  this.group3 = [];
  this.nGroups = 1;

  this.maxspeed = 300;    // Maximum speed
  this.maxforce = 150; // Maximum steering force
}

Boid.prototype.link = function(boids) {
  if (this.nGroups < 2) {
    this.group2 = boids;
    this.nGroups += 1;
  }
  else if(this.nGroups < 3) {
    this.group3 = boids;
    this.nGroups += 1;
  }
}

Boid.prototype.update = function() {
  this.flock();
  this.move();
  this.render();
}

Boid.prototype.applyForce = function(force) {
  // We could add mass here if we want A = F / M
  this.acceleration_curr.add(force);
}

Boid.prototype.move = function() {
  this.velocity.add(p5.Vector.mult(this.acceleration_last, 0.5 * deltaTime)); // v_{i+1/2} = v_i + 0.5*a_i dt 
  // Limit speed
  this.velocity.limit(this.maxspeed);
  this.position.add(p5.Vector.mult(this.velocity, deltaTime)); // x_{i+1} = x_i + v_{i+1/2}dt
  this.velocity.add(p5.Vector.mult(this.acceleration_curr, 0.5 * deltaTime));

  // save last acceleration
  this.acceleration_last.x = this.acceleration_curr.x;
  this.acceleration_last.y = this.acceleration_curr.y;
  // Reset current accelertion to 0 each cycle
  this.acceleration_curr.mult(0);
}

// A method that calculates and applies a steering force towards a target
// STEER = DESIRED MINUS VELOCITY
Boid.prototype.seek = function(target) {
  var desired = p5.Vector.sub(target,this.position);  // A vector pointing from the location to the target
  // Normalize desired and scale to maximum speed
  desired.normalize();
  desired.mult(this.maxspeed);
  // Steering = Desired minus Velocity
  var steer = p5.Vector.sub(desired,this.velocity);
  steer.limit(this.maxforce);  // Limit to maximum steering force
  return steer;
}

Boid.prototype.seekVelocity = function(target) {
  var desired = createVector(0, 0);
  desired.x = target.x;
  desired.y = target.y;
  desired.limit(this.maxspeed);
  var steer = p5.Vector.sub(desired, this.velocity);
  steer.limit(this.maxforce);
  return steer;
}

Boid.prototype.render = function() {
  // Draw a triangle rotated in the direction of velocity
  var theta = this.velocity.heading() + radians(90);
  fill(127);
  stroke(200);
  push();
  translate(this.position.x,this.position.y);
  rotate(theta);
  beginShape();
  vertex(0, -this.r*2);
  vertex(-this.r, this.r*2);
  vertex(this.r, this.r*2);
  endShape(CLOSE);
  pop();
}

// ----------------- Separation
// Method checks for nearby boids and steers away
Boid.prototype.separate = function() {
  var desiredseparation = 15.0;
  var steer = createVector(0,0);
  var count = 0;

  var calcSteer = function(b, boids) {
      // For every boid in the system, check if it's too close
    for (var i = 0; i < boids.length; i++) {
      var d = p5.Vector.dist(b.position, boids[i].position);
      // If the distance is greater than 0 and less than an arbitrary amount (0 when you are yourself)
      if ((d > 0) && (d < desiredseparation)) {
        // Calculate vector pointing away from neighbor
        var diff = p5.Vector.sub(b.position, boids[i].position);
        diff.normalize();
        diff.div(d);        // Weight by distance
        steer.add(diff);
        count++;            // Keep track of how many
      }
    }
  }

  calcSteer(this, this.group1);
  calcSteer(this, this.group2);
  if (this.nGroups === 3) calcSteer(this, this.group3);
  
  // Average -- divide by how many
  if (count > 0) {
    steer.div(count);
  }

  // As long as the vector is greater than 0
  if (steer.mag() > 0) {
    // Implement Reynolds: Steering = Desired - Velocity
    steer.normalize();
    steer.mult(this.maxspeed);
    steer.sub(this.velocity);
    steer.limit(this.maxforce);
  }
  return steer;
}

// ----------------- Alignment
// For every nearby boid in the system, calculate the average velocity
Boid.prototype.align = function() {
  var neighbordist = 100;
  var sum = createVector(0,0);
  var count = 0;

  var calcSteer = function(b, boids) {
    for (var i = 0; i < boids.length; i++) {
      var d = p5.Vector.dist(b.position, boids[i].position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(boids[i].velocity);
        count++;
      }
    }
  }

  calcSteer(this, this.group1);
  calcSteer(this, this.group2);
  if (this.nGroups === 3) calcSteer(this, this.group3);

  if (count > 0) {
    sum.div(count);
    sum.normalize();
    sum.mult(this.maxspeed);
    var steer = p5.Vector.sub(sum,this.velocity);
    steer.limit(this.maxforce);
    return steer;
  } else {
    return createVector(0,0);
  }
}

// ----------------- Cohesion
// Firstly, follow the guide
// For the average location (i.e. center) of all nearby boids, calculate steering vector towards that location
Boid.prototype.cohesion = function() {
  var guideWeight = 0.5; // (between 0~1) how much cohesion results from the guide
  //var neighbordist = 40;
  var sum = createVector(0,0);   // Start with empty vector to accumulate all locations
  var count = 0;

  var calcSum = function(b, boids) {
    for (var i = 0; i < boids.length; i++) {
      var d = p5.Vector.dist(b.position, boids[i].position);
      if (d > 0) {
        sum.add(boids[i].position); // Add location
        count++;
      }
    }
  }

  calcSum(this, this.group1);
  calcSum(this, this.group2);
  if (this.nGroups === 3) calcSum(this, this.group3);

  var steer = this.seekVelocity(this.guide.velocity);
  /*
  if (count > 0) {
    sum.div(count);
    sum.mult(1 - guideWeight);
    sum.add(p5.Vector.mult(this.guide.position, guideWeight));
    return this.seek(sum);  // Steer towards the location
  } else {
    return this.seek(this.guide.position);
  }
  */
 /*
  if (count > 0) {
    steer.mult(guideWeight);
    sum.div(count);
    steer.add(this.seek(sum).mult(1 - guideWeight));
  }

  return steer;
  */


  var constraintDist = 10;
  if (p5.Vector.dist(this.position, this.guide.position) > constraintDist) {
    steer.add(this.seek(this.guide.position));
    return steer;
  }
  else return createVector(0,0);
  
}

// We accumulate a new acceleration each time based on three rules
Boid.prototype.flock = function() {
  var sep = this.separate();   // Separation
  var ali = this.align();      // Alignment
  var coh = this.cohesion();   // Cohesion
  // Arbitrarily weight these forces
  sep.mult(15);
  ali.mult(10);
  coh.mult(15);
  // Add the force vectors to acceleration
  this.applyForce(sep);
  this.applyForce(ali);
  this.applyForce(coh);
}
