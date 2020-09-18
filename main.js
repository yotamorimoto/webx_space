const numGrain =  70;
const ampFactor = Math.sqrt(1/numGrain);
const toDegree = 180/Math.PI;
const maxOrder = 3;
const url = ['0.mp3', '1.mp3', '2.mp3', '5.mp3', '9.mp3', '11.mp3', '14.mp3'];
var context, sound=[],low=[];
var rotator, decoder, filters;
var vec3=[],amp=[],enc=[],obj=[];

let mobile = false;
if (
	  navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)
) { mobile = true };

const gl = document.getElementById('gl');
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xccccde );
scene.fog = new THREE.FogExp2(0xaaaaef, 0.1);

// --------- camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.x = -0.5;
camera.position.y = -0.02;
camera.position.z = 0.01;
// camera.rotation.reorder('YXZ');

// --------- renderer
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
gl.appendChild(renderer.domElement);

// --------- start
document.getElementById('play').addEventListener('click', function(){
	if (mobile) {
		controls = new THREE.DeviceOrientationControls(camera);
		controls.connect(); // do it twice! ... (once at the Ctor above)
	} else {
		controls = new THREE.OrbitControls(camera, renderer.domElement);
		controls.autoRotateSpeed = 1.6789;
		controls.autoRotate = true;
	}
	load();
	hide();
});
// function loadSound(url) {
// 	return fetch(url)
// 	.then(data => data.arrayBuffer())
// 	.then(arrayBuffer => context.decodeAudioData(arrayBuffer))
// 	.then(decodedBuffer => {
// 		sound.push(decodedBuffer);
// 		console.log('loaded ' + url);
// 	});
// }
const loadSound = (url) => {
  const request = new XMLHttpRequest();
  request.open('GET', url);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    let arrayBuffer = request.response;
    context.decodeAudioData(arrayBuffer, (decodedBuffer) => sound.push(decodedBuffer), (e) => console.log(e));
  };
	request.send();
}
async function load() {
	AudioContext = window.AudioContext || window.webkitAudioContext;
	context  = new AudioContext({ latencyHint: 2048/44100 });
	decoder = new ambisonics.binDecoder(context, maxOrder);
	rotator = new ambisonics.sceneRotator(context, maxOrder)
	decoder.out.connect(context.destination);
	filters = new ambisonics.HRIRloader_ircam(context, maxOrder, (buffer) => {
		console.log('successfully loaded HOA buffer:', buffer);
		decoder.updateFilters(buffer);
	});
	filters.load('IRC_1076_C_HRIR_44100.sofa.json');
	document.getElementById('loading').style.backgroundColor = 'rgb(255,255,255)';
	for (let i=0; i<url.length; i++) {
		loadSound(url[i]);
	}
	setTimeout(play, 5000);
	// setTimeout(askFullscreen, 5000);
	// console.log('promise');
	// Promise.all([
	// 	loadSound('2.mp3'),
	// 	loadSound('5.mp3'),
	// 	loadSound('9.mp3'),
	// 	loadSound('11.mp3')
	// ]).then(play);
}
// --------- things
function randIndex(){
  return Math.floor(Math.random()*url.length)
}
function chooseFrom(array){
  return array[Math.floor(Math.random()*array.length)]
}
const geometry = [
	new THREE.ConeGeometry(5, 20, 32),
	new THREE.DodecahedronGeometry(10, 0),
	new THREE.OctahedronGeometry(10, 0),
	new THREE.SphereGeometry(5, 32, 32),
	new THREE.TetrahedronGeometry(10, 0),
	new THREE.TorusGeometry(10, 3, 6, 3),
	new THREE.TorusKnotGeometry(9, 2, 8, 3, 2, 2)
];
var material = new THREE.MeshToonMaterial({ color: 0x9999ab });
// --------- lights
var light = new THREE.DirectionalLight( 0xffffff );
light.position.set( 1, 2, 3 );
scene.add(light);
light = new THREE.DirectionalLight( 0x888888 );
light.position.set( 3, 2, 1 );
scene.add(light);
light = new THREE.AmbientLight( 0x222222 );
scene.add(light);

function play() {
	document.getElementById('loading').remove();
	for (let i=0; i<numGrain; i++) {
		let index = randIndex();
		obj.push(new THREE.Mesh(geometry[index], material));
		enc.push(new ambisonics.monoEncoder(context, maxOrder));
		vec3.push(new THREE.Vector3(0, 0, Math.random()*2-1));
		obj[i].position.x = 0;
		obj[i].position.y = 0;
		obj[i].position.z = vec3[i].z;
		obj[i].rotation.x = obj[i].rotation.y = obj[i].rotation.z = Math.random()*2-1;
		obj[i].scale.x = obj[i].scale.y = obj[i].scale.z = Math.random()*0.01+0.01;
		obj[i].updateMatrix();
		scene.add(obj[i]);
		let node = context.createBufferSource();
		let s    = new THREE.Spherical();
		let d    = Math.max(vec3[i].distanceTo(camera.position), 0.05);
		low.push(context.createBiquadFilter());
		low[i].type       = 'lowshelf';
		low[i].frequency  = 150;
		low[i].gain.value = 0;
		s.setFromVector3(vec3[i]);
		amp.push(context.createGain());
		node.buffer = sound[index];
		node.loop = true;
		node.playbackRate.value = chooseFrom([0.125, 0.25, 0.5, 1.0, 1/1.5]);
		node.connect(amp[i]);
		amp[i].connect(enc[i].in);
		amp[i].gain.value = 1/d*ampFactor;
		low[i].gain.value = 12-(d*9);
		enc[i].azim = s.phi   * toDegree;
		enc[i].elev = s.theta * toDegree;
		enc[i].out.connect(rotator.in);
		enc[i].updateGains();
		rotator.out.connect(decoder.in);
		node.start();
	}
	loop();
}
function loop(){
	let t = 0.0002 * Date.now();
	requestAnimationFrame(loop);
	for (let i=0; i<numGrain; i++) {
		let o = obj[i];
		let d = Math.max(vec3[i].distanceTo(camera.position), 0.05);
		let s = new THREE.Spherical();
		vec3[i].x = Math.cos(t+i);
		vec3[i].y = Math.sin(t+i*1.1);
		o.position.x = vec3[i].x;
		o.position.y = vec3[i].y;
		o.position.z = vec3[i].z;
		// o.updateMatrix();
		s.setFromVector3(vec3[i]);
		amp[i].gain.value = 1/d*ampFactor;
		low[i].gain.value = 12-(d*9);
		enc[i].azim = s.phi   * toDegree;
		enc[i].elev = s.theta * toDegree;
		enc[i].updateGains();
	}
	controls.update();
	rotator.yaw   = camera.rotation.y * toDegree;
	rotator.pitch = camera.rotation.x * toDegree;
	rotator.roll  = camera.rotation.z * toDegree;
	rotator.updateRotMtx();
	renderer.render(scene, camera);
};

function askFullscreen() {
	if (gl.requestFullscreen) {
		gl.requestFullscreen();
	} else if (gl.mozRequestFullScreen) { /* Firefox */
		gl.mozRequestFullScreen();
	} else if (gl.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
		gl.webkitRequestFullscreen();
	} else if (gl.msRequestFullscreen) { /* IE/Edge */
		gl.msRequestFullscreen();
	}
	gl.style.width = '100%';
	gl.style.height = '100%';
}
// --------- box
// const boxGeo = new THREE.BoxBufferGeometry( 100, 100, 100, 4, 4, 4 );
// const boxMat = new THREE.MeshBasicMaterial( { color: 0xff00ff, wireframe: true } );
// const box    = new THREE.Mesh( boxGeo, boxMat );
// scene.add(box);

function hide(){
	document.getElementById('play').remove();
	if (mobile) {
		document.getElementById('text').style.color = 'transparent';
		document.getElementById('text').style.backgroundColor = 'transparent';
	}
}
// --------- resize
function onWindowResize(){
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('orientationchange', onWindowResize);
window.addEventListener('resize', onWindowResize, false);
