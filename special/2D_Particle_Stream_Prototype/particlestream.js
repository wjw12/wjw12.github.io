function ParticleStream() {
    this.maxNodes = 7;
    this.nodes = [];
    this.springs = [];
    this.headMove = new p5.Vector(0, 0);
    this.cm = new p5.Vector(0, 0);
    this.cmVelocity = new p5.Vector(0, 0);
    this.isMoving = false;
  
    this.windCountDown = 0;
    this.windDuration = 1.5;
    this.windDir = new p5.Vector(0, 0);
    this.windIntensity = 300;
  
    // initialize nodes
    for (var i = 0; i < this.maxNodes; i++) {
      this.addNode(new SpringNode((i+1)*screenWidth / 10, seaLevel, (i+2)*(i+2)));
    }
    this.head = this.nodes[0]; // we can only control the head movement
    this.nodes[0].setHead(true);
  
    // initialize springs
    for (var i = 0; i < this.maxNodes - 1; i++) {
      var sp = new Spring((i+2)*10, (this.maxNodes-i)*40, 10, this.nodes[i], this.nodes[i+1]);
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