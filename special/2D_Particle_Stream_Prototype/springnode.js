function SpringNode(x, y, d) {
    this.acceleration_last = createVector(0,0);
    this.acceleration_curr = createVector(0,0);
    this.position = createVector(x, y);
    this.velocity = createVector(0,0);
  
    this.maxspeed = 300;    // Maximum speed (dont know if necessary)
    this.maxforce = 150; // Maximum steering force (it is maximum acceleration if m=1)
    this.isHead = false;
    this.r = 5;  // render size
    this.time = 0;
    this.constraintDist = d;
  
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