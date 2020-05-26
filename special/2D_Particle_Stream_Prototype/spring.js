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
  
  