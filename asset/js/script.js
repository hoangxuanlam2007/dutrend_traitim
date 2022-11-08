/* 
    requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
    MIT license
    This is taken from https://gist.github.com/NeptunKid/61c71f9469f531bb9c01
    by Lâm
*/

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
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

// ------------------------------ //



function canvas(){
  
/*
    Settings
*/

var settings = {

  particles: {
      effect: -0.75,
      length: 500,
      velocity: 100,
      size: 40,
      duration: 3,
    },
};


/*
  Particle
*/

var Particle = (function() {

  function Particle() {
    this.position = new Point();
    this.velocity = new Point();
    this.acceleration = new Point();
    this.age = 0;
  }

  Particle.prototype.initialize = function(x, y, dx, dy) {
    this.position.x = x;
    this.position.y = y;
    this.velocity.x = dx;
    this.velocity.y = dy;
    this.acceleration.x = dx * settings.particles.effect;
    this.acceleration.y = dy * settings.particles.effect; 
    this.age = 0;
  };

  Particle.prototype.update = function(deltaTime) {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.velocity.x += this.acceleration.x * deltaTime;
    this.velocity.y += this.acceleration.y * deltaTime;
    this.age += deltaTime;
  };

  Particle.prototype.draw = function(context, image) {

  var size = image.width * ease(this.age / settings.particles.duration);

    function ease(t) {
      return (--t) * t * t + 1;
    }

    context.globalAlpha = 1 - this.age / settings.particles.duration;
    context.drawImage(image, this.position.x - size / 10, this.position.y - size / 10, size, size);

  };

  return Particle;

})();

/*
  ParticlePool
*/

var ParticlePool = (function() {
  var particles,
      firstActive = 0,
      firstFree   = 0,
      duration    = settings.particles.duration;

  function ParticlePool(length) {
    particles = new Array(length);
    for (var i = 0; i < particles.length; i++)
      particles[i] = new Particle();
  }

  ParticlePool.prototype.add = function(x, y, dx, dy) {
    particles[firstFree].initialize(x, y, dx, dy);
    firstFree++;

    if (firstFree == particles.length) firstFree = 0;
    if (firstActive == firstFree) firstActive++;
    if (firstActive == particles.length) firstActive = 0;
  };

  ParticlePool.prototype.update = function(deltaTime) {
    var i;

    if (firstActive < firstFree) {
      for (i = firstActive; i < firstFree; i++)
        particles[i].update(deltaTime);
    }

    if (firstFree < firstActive) {
      for (i = firstActive; i < particles.length; i++)
        particles[i].update(deltaTime);

      for (i = 0; i < firstFree; i++)
        particles[i].update(deltaTime);
    }

    // Remove inactive particles - Bug
    while (particles[firstActive].age >= duration && firstActive != firstFree) {
      firstActive++;
      if (firstActive == particles.length) firstActive = 0;
    }
  };

  ParticlePool.prototype.draw = function(context, image) {
    // Draw Heart
    if (firstActive < firstFree) {
      for (i = firstActive; i < firstFree; i++)
        particles[i].draw(context, image);
    }

    if (firstFree < firstActive) {
      for (i = firstActive; i < particles.length; i++)
        particles[i].draw(context, image);
    
      for (i = 0; i < firstFree; i++)
        particles[i].draw(context, image);
    }
  };

  return ParticlePool;

})();

/*
Point
*/

var Point = (function() {

function Point(x, y) {
  this.x = (typeof x !== 'undefined') ? x : 0;
  this.y = (typeof y !== 'undefined') ? y : 0;
}

Point.prototype.clone = function() {
  return new Point(this.x, this.y);
};

Point.prototype.length = function(length) {
  if (typeof length == 'undefined')
    return Math.sqrt(this.x * this.x + this.y * this.y);
  this.normalize();
  this.x *= length;
  this.y *= length;

  return this;
};

Point.prototype.normalize = function() {
  var length = this.length();
  this.x /= length;
  this.y /= length;
  return this;
};

return Point;
})();

/*
  Canvas
*/

(function(canvas) {
var context = canvas.getContext('2d'),
    particles = new ParticlePool(settings.particles.length),
    particleRate = settings.particles.length / settings.particles.duration,
    time;

function pointOnHeart(t) {
  return new Point(
    160 * Math.pow(Math.sin(t), 3),
    130 * Math.cos(t) - 50 * Math.cos(2 * t) - 20 * Math.cos(3 * t) - 10 * Math.cos(4 * t) + 25
  ); 
}

var image = (function() {
  var canvas  = document.createElement('canvas'),
  context = canvas.getContext('2d');
  canvas.width  = settings.particles.size;
  canvas.height = settings.particles.size;

  function to(t) {
  var point = pointOnHeart(t);
    point.x = settings.particles.size / 2 + point.x * settings.particles.size / 750;
    point.y = settings.particles.size / 2 - point.y * settings.particles.size / 750;
    return point;
  }

  // Path
  context.beginPath();
  var t = -Math.PI;
  var point = to(t);
  context.moveTo(point.x, point.y);

  while (t < Math.PI) {
    t += 0.01;
    point = to(t);
    context.lineTo(point.x, point.y);
  }

  context.closePath();
  context.fillStyle = '#FF2A64';
  context.fill();

  var image = new Image();
  image.src = canvas.toDataURL();

  return image;
})();


/*
  Render  
*/

function render() {
  requestAnimationFrame(render);

  // Duration
  var newTime   = new Date().getTime() / 1000,
      deltaTime = newTime - (time || newTime);
      time = newTime;
  context.clearRect(0, 0, canvas.width, canvas.height);

  var amount = particleRate * deltaTime;
  for (var i = 0; i < amount; i++) {
    var pos = pointOnHeart(Math.PI - 2 * Math.PI * Math.random());
    var dir = pos.clone().length(settings.particles.velocity);
      particles.add(canvas.width / 2 + pos.x, canvas.height / 2 - pos.y, dir.x, -dir.y);
  }

  particles.draw(context, image);
  particles.update(deltaTime);
}



// Resize window trigger

function onResize() {
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

window.onresize = onResize;

// Load
window.onload = function() {
  onResize();
  render();
}

})(document.getElementsByClassName('heart')[0]);

}

function cloneCanvas(oldCanvas) {

  //create a new canvas
  var newCanvas = document.createElement('canvas');
  var context = newCanvas.getContext('2d');

  //set dimensions
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;

  //apply the old canvas to the new one
  context.drawImage(oldCanvas, 0, 0);

  //return the new canvas
  return newCanvas;
}

canvas();