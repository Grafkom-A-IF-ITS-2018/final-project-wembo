var scene, camera,fieldOfView,aspesctRatio,nearPlane,farPlane,shadowLight,light,renderer,container,
    HEIGHT,WIDTH,windowHalfX,windowHalfY,xLimit,yLimit, mixer;

var clock = new THREE.Clock();
var fish;

// PARTICLES
var colors = ['#dff69e', '#00ceff', '#002bca', '#ff00e0', '#3f159f', '#71b583', '#00a2ff'];
var flyingParticles = []; 
		waitingParticles = [];
    zLocationParticles=0;
// SPEED
var speed = {x:0, y:0};
var smoothing = 10;

// MISC
var mousePos = {x:0, y:0};
var stats;
var halfPI = Math.PI/2;

function getRandomArbitrary() {
  var max=0.6;
  var min=0.5;
  return Math.random() * (max - min) + min;
}

function init(){
  scene = new THREE.Scene();
  
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  aspectRatio = WIDTH / HEIGHT;
  fieldOfView = 60;
  nearPlane = 1; // the camera won't "see" any object placed in front of this plane
  farPlane = 2000; // the camera wont't see any object placed further than this plane
  camera = new THREE.PerspectiveCamera( fieldOfView, aspectRatio,nearPlane,farPlane);
  camera.position.z = 1000;  
  
  renderer = new THREE.WebGLRenderer({alpha: true, antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  container = document.getElementById('world');
  container.appendChild(renderer.domElement);
  
  // convert the field of view to radians
  var ang = (fieldOfView/2)* Math.PI / 180; 
  // calculate the max y position seen by the camera related to the maxParticlesZ position, I start by calculating the y limit because fielOfView is a vertical field of view. I then calculate the x Limit
  yLimit = (camera.position.z + zLocationParticles) * Math.tan(ang); // this is a formula I found, don't ask me why it works, it just does :) 
  // Calculate the max x position seen by the camera related to the y Limit position
  xLimit = yLimit *camera.aspect;
   
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;

  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('mousemove', handleMouseMove, false);
}

function onWindowResize() {
  HEIGHT = window.innerHeight;
  WIDTH = window.innerWidth;
  windowHalfX = WIDTH / 2;
  windowHalfY = HEIGHT / 2;
  renderer.setSize(WIDTH, HEIGHT);
  camera.aspect = WIDTH / HEIGHT;
  camera.updateProjectionMatrix(); // force the camera to update its aspect ratio
  // recalculate the limits
 	var ang = (fieldOfView/2)* Math.PI / 180; 
  yLimit = (camera.position.z + zLocationParticles) * Math.tan(ang); 
  xLimit = yLimit *camera.aspect;
}

function handleMouseMove(event) {
  mousePos = {x:event.clientX, y:event.clientY};
  updateSpeed()
}

function handleTouchStart(event) {
  if (event.touches.length > 1) {
    event.preventDefault();
		mousePos = {x:event.touches[0].pageX, y:event.touches[0].pageY};
    updateSpeed();
  }
}

function handleTouchEnd(event) {
    mousePos = {x:windowHalfX, y:windowHalfY};
    updateSpeed();
}

function handleTouchMove(event) {
  if (event.touches.length == 1) {
    event.preventDefault();
		mousePos = {x:event.touches[0].pageX, y:event.touches[0].pageY};
    updateSpeed();
  }
}

function updateSpeed(){
  speed.x = (mousePos.x / WIDTH)*100;
  speed.y = (mousePos.y-windowHalfY) / 10;
}


  THREE.DRACOLoader.setDecoderPath( 'js/libs/draco/gltf/' );
		var loader = new THREE.GLTFLoader();
    loader.setDRACOLoader( new THREE.DRACOLoader() );

		loader.load('../assets/pink_fish.gltf', function ( gltf ) {
      fish = gltf.scene;

      fish.scale.set(50, 50, 50);
          
      scene.add(fish);

      mixer = new THREE.AnimationMixer(fish);
	
			mixer.clipAction( gltf.animations[0]).play();
      mixer.clipAction( gltf.animations[1]).play();
      
      loop();
  });

function loop() {  
  fish.rotation.z += ((-speed.y/50)-fish.rotation.z)/smoothing;
  fish.rotation.x += ((-speed.y/50)-fish.rotation.x)/smoothing;
  fish.rotation.y += ((-speed.y/50)-fish.rotation.y + 5)/smoothing;
  
  // make the fish move according to the mouse direction
  fish.position.x += (((mousePos.x - windowHalfX)) - fish.position.x) / smoothing;
  fish.position.y += ((-speed.y*10)-fish.position.y)/smoothing;
  
  for (var i=0; i<flyingParticles.length; i++){
    var particle = flyingParticles[i];
    particle.rotation.y += (1/particle.scale.x) *.05;
    particle.rotation.x += (1/particle.scale.x) *.05;
    particle.rotation.z += (1/particle.scale.x) *.05;
    particle.position.x += -10 -(1/particle.scale.x) * speed.x *.2;
    particle.position.y += (1/particle.scale.x) * speed.y *.2;
    if (particle.position.x < -xLimit - 80){ 
      scene.remove(particle);
      waitingParticles.push(flyingParticles.splice(i,1)[0]); 
      i--;
    }
  }
  
  renderer.render(scene, camera);
  stats.update();
  requestAnimationFrame(loop);
  var delta = clock.getDelta();
  mixer.update( delta );
}

function createStats() {
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.top = '0px';
  stats.domElement.style.right = '0px';
  container.appendChild(stats.domElement);
}


//Lights
//an hemisphere to give a global ambient light
//harder light to add some shadows
function createLight() {
  light = new THREE.HemisphereLight(0xffffff, 0xffffff, .3)
  scene.add(light);
  shadowLight = new THREE.DirectionalLight(0xffffff, .8);
  shadowLight.position.set(1, 1, 1);
 	scene.add(shadowLight);
}

function createParticle(){
  var particle, geometryCore, ray, w,h,d, sh, sv;
  
  var rnd = Math.random();
  
  //box
  if (rnd<.33){
    w = 20 + getRandomArbitrary()*30;
    h = 20 + getRandomArbitrary()*30;
    d = 20 + getRandomArbitrary()*30;
    geometryCore = new THREE.BoxGeometry(w,h,d);
  }
  // Tetrahedron
  else if (rnd<.66){
    ray = 20 + getRandomArbitrary()*30;
    geometryCore = new THREE.TetrahedronGeometry(ray);
  }
  // sphere (but random on segment vert and hor)
  else{
    ray = 5+getRandomArbitrary()*30;
    sh = 7 + Math.floor(getRandomArbitrary()*2);
    sv = 7 + Math.floor(getRandomArbitrary()*2);
    geometryCore = new THREE.SphereGeometry(ray, sh, sv);
  }
  
  var materialCore = new THREE.MeshLambertMaterial({
    color: getRandomColor(),
    shading: THREE.FlatShading
  });
  particle = new THREE.Mesh(geometryCore, materialCore);
  return particle;
}



function getParticle(){
  
  if (waitingParticles.length && flyingParticles.length<10) {
    return waitingParticles.pop();
  }else{
    return createParticle();
  }
}

function flyParticle(){
  if(flyingParticles.length<10){
    var particle = getParticle();
    particle.position.x = xLimit;
    particle.position.y = -yLimit + Math.random()*yLimit*2;
    particle.position.z = zLocationParticles;
    var s = .1 + getRandomArbitrary();
    particle.scale.set(s,s,s);
    flyingParticles.push(particle);
     scene.add(particle);
  }
}



function getRandomColor(){
  var col = hexToRgb(colors[Math.floor(Math.random()*colors.length)]);
  var threecol = new THREE.Color("rgb("+col.r+","+col.g+","+col.b+")");
  return threecol;
}
  
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

init();
createStats();
createLight();
createParticle();
setInterval(flyParticle, 100);
