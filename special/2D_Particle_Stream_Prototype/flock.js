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
  
    /*
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
    */

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
    var steer = this.seekVelocity(this.guide.velocity);
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
  