var scene, camera,fieldOfView,aspesctRatio,nearPlane,farPlane,shadowLight,light,renderer,container,
    HEIGHT,WIDTH,windowHalfX,windowHalfY,xLimit,yLimit,fish, heart;

var mixer = [];

var clock = new THREE.Clock();

// PARTICLES
var colors = ['#dff69e', '#00ceff', '#002bca', '#ff00e0', '#3f159f', '#71b583', '#00a2ff'];
var flyingParticles = []; 
    waitingParticles = [];
    waitingFood=[];
    zLocationParticles=0;
  var hearts=[];
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

//sound
var bite=new Audio('assets/Bite.mp3');
var pain=new Audio('assets/Pain.mp3');

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

if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", function () {
    mousePos = {x:event.beta, y:event.gamma};
    speed.y=-(mousePos.y);
    speed.x=(mousePos.x*2+40);
  }, true);
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
  speed.x = (mousePos.x / WIDTH)*50;
  speed.y = (mousePos.y-windowHalfY) / 10;
}

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
      if(particle.name=="obstacle") waitingParticles.push(flyingParticles.splice(i,1)[0]);
      else waitingFood.push(flyingParticles.splice(i,1)[0]);
      i--;
    }
  }
  
  renderer.render(scene, camera);
  stats.update();
  requestAnimationFrame(loop);
  var delta = clock.getDelta();

  for (var i = 0; i < mixer.length; i++){
    mixer[i].update( delta );
  }
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

THREE.DRACOLoader.setDecoderPath( 'js/libs/draco/gltf/' );
var loader = new THREE.GLTFLoader();
loader.setDRACOLoader( new THREE.DRACOLoader() );

function createFish(){
  loader.load('../assets/pink_fish.gltf', function ( gltf ) {
    fish = gltf.scene;

    fish.scale.set(50, 50, 50);
        
    scene.add(fish);
    light = new THREE.HemisphereLight(0xffffff, 0xffffff, .3)
    scene.add(light);
    shadowLight = new THREE.DirectionalLight(0xffffff, .8);
    shadowLight.position.set(1, 1, 1);
    scene.add(shadowLight);

    mixer.push(new THREE.AnimationMixer(fish));

    mixer[mixer.length-1].clipAction( gltf.animations[0]).play();
    mixer[mixer.length-1].clipAction( gltf.animations[1]).play();
    
    loop();
  });
}

function createOrnamen() {
  setTimeout(function () {
    loader.load('../assets/coral2.gltf', function ( gltf ) {
      var coral = gltf.scene;
      coral.scale.set(100, 100, 100);

      
      
      //moving coral to the corners of canvas
      var plane = new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 1));
  
      var raycaster = new THREE.Raycaster();
      var corner = new THREE.Vector2();
      var cornerPoint = new THREE.Vector3();
  
      corner.set(0.1, -1); // NDC of the bottom-left corner
      raycaster.setFromCamera(corner, camera);
      raycaster.ray.intersectPlane(plane, cornerPoint);
      coral.position.copy(cornerPoint).add(new THREE.Vector3(1, 1, -1));
  
      coral.rotation.y += 1.6;
      coral.rotation.z -= 0.2;
      coral.rotation.x -= 0.2;
  
      scene.add(coral);
  
      mixer.push(new THREE.AnimationMixer(coral));
      mixer[mixer.length-1].clipAction( gltf.animations[0]).play();
  
      console.log('yay')
      loop();
    });
  }, 1000);
}

function createHeart(i){
  loader.load('../assets/heart.gltf', function ( gltf ) {
    var xx = 0.1;
    var heart = gltf.scene;
      heart.scale.set(30, 30, 30);
      heart.position.y = 0.6 * window.innerHeight;
      heart.position.x = (-0.7 + xx * i) * window.innerWidth;
      scene.add(heart);
    return heart;
  });
}

function createHeartNumber(){
  for(var i=0;i<2;i++){
    hearts.push(createHeart(i));
  }
}


function createParticle(){
  var particle, geometryCore, ray, w,h,d, sh, sv;
  
  var rnd = Math.random();
  
  //box
  if (rnd<.5){
    w = 20 + getRandomArbitrary()*30;
    h = 20 + getRandomArbitrary()*30;
    d = 20 + getRandomArbitrary()*30;
    geometryCore = new THREE.BoxGeometry(w,h,d);
  }
  // Tetrahedron
  else{
    ray = 20 + getRandomArbitrary()*30;
    geometryCore = new THREE.TetrahedronGeometry(ray);
  }
  
  var materialCore = new THREE.MeshLambertMaterial({
    color: getRandomColor(),
    shading: THREE.FlatShading
  });
  particle = new THREE.Mesh(geometryCore, materialCore);
  geometryCore.computeBoundingSphere();
  particle.boundingSphere=geometryCore.boundingSphere;
//  particle.name='obstacle';
  //console.log(particle.boundingSphere.radius);
  return particle;
}

function createFood(){
  var particle, geometryCore, ray, w,h,d, sh, sv;
  ray = 20+getRandomArbitrary()*30;
  sh = 22 + Math.floor(getRandomArbitrary()*2);
  sv = 22 + Math.floor(getRandomArbitrary()*2);
  geometryCore = new THREE.SphereGeometry(ray, sh, sv);
  var materialCore = new THREE.MeshPhongMaterial({
    color: 0x4e5e5f,
    ambient: 0xffffff,
    emissive: 0x000000,
    specular: 0x111111,
    shininess: 31
  });
  particle = new THREE.Mesh(geometryCore, materialCore);
  return particle;
}

function getParticle(){
  
  if (waitingParticles.length ) {
    return waitingParticles.pop();
  }else{
    return createParticle();
  }
}
function getFood(){ 
  if (waitingFood.length) {
    return waitingFood.pop();
  }else{
    return createFood();
  }
}

function flyObject(){
  if(flyingParticles.length<10){
    if(Math.random()>.1 && Math.random()<.3){
      var particle2=getFood();
      particle2.position.x = xLimit;
      particle2.position.y = -yLimit + Math.random()*yLimit*2;
      particle2.position.z = zLocationParticles;
      particle2.name="food";
      var s = .1 + getRandomArbitrary();
      particle2.scale.set(s,s,s);
      flyingParticles.push(particle2);
      scene.add(particle2);
    }
    var particle = getParticle();
    particle.position.x = xLimit;
    particle.position.y = -yLimit + Math.random()*yLimit*2;
    particle.position.z = zLocationParticles;
    particle.name="obstacle";
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

function isCollision(xp,yp,sp,xf,yf,sf) {
  var xCollide=false;
  var yCollide=false;
  if(xp<xf&&xp+sp>=xf-sf)xCollide=true;
  if(xf<xp&&xf+sf>=xp-sp) xCollide=true;
  if(xf==xp) xCollide=true;
  if(yp<yf&&yp+sp>=yf-sf) yCollide=true;
  if(yf<yp&&yf+sf*2>=yp-sp*2) yCollide=true;
  if(yf==yp) yCollide=true;
  if(xCollide&&yCollide) return true;
  return false;
}
var skor=0;
function detectCollision(){
  for(var i=0;i<flyingParticles.length;i++){
    var particle=flyingParticles[i];
    var xp=particle.position.x;
    var yp=particle.position.y;
    var sp=particle.scale.x;
    var xf=fish.position.x;
    var yf=fish.position.y;
    var sf=fish.scale.x;
    if(isCollision(xp,yp,10,xf,yf,50)){
      console.log(flyingParticles[i].name," food ",flyingParticles[i].name=="food");
      if(flyingParticles[i].name=="food"){
        console.log("nabrak");
        bite.pause();
        bite.currentTime = 0;
        pain.pause();
        pain.currentTime = 0;
        bite.play();
        
        skor++;
        console.log("skor = ",skor);
        scene.remove(flyingParticles[i]);
      }
      else{
        console.log("nabrak");
        bite.pause();
        bite.currentTime = 0;
        pain.pause();
        pain.currentTime = 0;
        pain.play();
        scene.remove(flyingParticles[i]);
      }
      
      console.log(flyingParticles[i]);
      flyingParticles.splice(i,1);
      i--;
    }
  }
}

init();
createStats();
createLight();
createHeartNumber();
createFish();
createOrnamen();
createParticle();
setInterval(flyObject, 500);
setInterval(detectCollision, 50);
