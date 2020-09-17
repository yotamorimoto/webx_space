const numGrain =  100;
const speedOfSound = 343;
const earDistance = 0.22;
const maxOrder = 3;
var context, audio;
var encoder=[], rotator, decoder, filters;

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

// if(mobile){
// 	alert('映像のみの再生となります。VR音響はデスクトップ環境をご利用下さい。');
// }
var context, listener, sound;
var controls;
var objs = [];

const gl = document.getElementById('gl');
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xccccde );
scene.fog = new THREE.FogExp2( 0xaaaaef, 0.02 );

// --------- camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 5;
// camera.rotation.reorder('YXZ');

// --------- renderer
let renderer = new THREE.WebGLRenderer();
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
		// controls.autoRotate = true;
		controls.enableZoom = false;
		// camera.position.z = 0; // ????
	}
	// askFullscreen();
	load();
	hide();
	loop();
});
function load() {
	AudioContext = window.AudioContext || window.webkitAudioContext;
	context  = new AudioContext({ latencyHint: 2048/44100 });
	context  = new AudioContext({ latencyHint: 2048/44100 });
	decoder = new ambisonics.binDecoder(context, maxOrder);
	rotator = new ambisonics.sceneRotator(context, maxOrder)
	decoder.out.connect(context.destination);
	filters = new ambisonics.HRIRloader_ircam(context, maxOrder, (buffer) => {
		console.log('successfully loaded HOA buffer:', buffer);
		decoder.updateFilters(buffer);
	});
	filters.load('IRC_1076_C_HRIR_44100.sofa.json');
	fetch('2.mp3')
	.then(data => data.arrayBuffer())
	.then(arrayBuffer => context.decodeAudioData(arrayBuffer))
	.then(decodedBuffer => { audio = decodedBuffer })
	;
}
function play() {
	for (let i=0; i<numGrain; i++) {
		let enc = new ambisonics.monoEncoder(context, maxOrder);
		let sound = context.createBufferSource();
		let amp   = context.createGain();
		sound.buffer = audio;
		sound.loop = true;
		sound.playbackRate.value = chooseFrom([0.125, 0.25, 0.5, 1.0, 1.5]);
		sound.connect(amp);
		amp.connect(enc.in);
		amp.gain.value = 0.03;
		enc.azim = Math.random() * 360 - 180;
		enc.elev = Math.random() * 360 - 180;
		enc.out.connect(rotator.in);
		enc.updateGains();
		rotator.out.connect(decoder.in);
		sound.start();
	}
}
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
// --------- controls
// controls.rotateUp(Math.PI / 4);
// controls.target.set(
// 	camera.position.x + 0.1,
// 	camera.position.y,
// 	camera.position.z
// );
// controls.noZoom = true;
// controls.noPan = true;

// var controls
// controls = new THREE.OrbitControls(camera, renderer.domElement);
// controls.addEventListener('change', function(e) {
// 	foaRenderer.setRotationMatrix4(camera.matrixWorld.elements);
// });

// --------- video
document.getElementById('loading').remove();
// setTimeout(ready, 1000);
// function ready(){ document.getElementById('loading').remove() };

// --------- box
// const boxGeo = new THREE.BoxBufferGeometry( 100, 100, 100, 4, 4, 4 );
// const boxMat = new THREE.MeshBasicMaterial( { color: 0xff00ff, wireframe: true } );
// const box    = new THREE.Mesh( boxGeo, boxMat );
// scene.add(box);

// --------- things
function chooseFrom(array){
  return array[Math.floor(Math.random()*array.length)]
}
var geometry = [
	new THREE.ConeGeometry( 5, 20, 32 ),
	new THREE.DodecahedronGeometry(10, 0),
	new THREE.OctahedronGeometry(10, 0),
	new THREE.SphereGeometry( 5, 32, 32 ),
	new THREE.TetrahedronGeometry(10, 0),
	new THREE.TorusGeometry( 10, 3, 6, 3 ),
	new THREE.TorusKnotGeometry( 9, 2, 8, 3, 2, 2 )
];
var material = new THREE.MeshToonMaterial({ color: 0x9999ab });

function makeObjects() {
	for (var i=0; i<numGrain; i++) {
		var mesh = new THREE.Mesh(
			chooseFrom(geometry),
			material
		);
		mesh.position.x = Math.random() * 10 - 5;
		mesh.position.y = Math.random() * 10 - 5;
		mesh.position.z = Math.random() * 10 - 5;
		mesh.rotation.x = mesh.rotation.y = mesh.rotation.z = Math.random() * 2 - 1;
		mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 0.05 + 0.01;
		mesh.updateMatrix();
		// mesh.add(sound[i]);
		scene.add( mesh );
		objs.push( mesh );
	}
};
// --------- lights
var light = new THREE.DirectionalLight( 0xffffff );
light.position.set( 1, 2, 3 );
scene.add( light );
light = new THREE.DirectionalLight( 0x888888 );
light.position.set( 3, 2, 1 );
scene.add( light );
light = new THREE.AmbientLight( 0x222222 );
scene.add( light );

function hide(){
	document.getElementById('play').remove();
	// if(mobile){
	// 	document.getElementById('text').style.color = 'transparent';
	// 	document.getElementById('text').style.backgroundColor = 'transparent';
	// }
}

function loop(){
	var t = 0.0001 * Date.now();
	requestAnimationFrame(loop);
	for (var i = 0, il = objs.length; i < il; i ++ ) {
		var obj = objs[i];
		obj.position.x = 5 * Math.cos( t + i );
		obj.position.y = 5 * Math.sin( t + i * 1.1);
	}
	controls.update();
	rotator.yaw = camera.rotation.y*180/Math.PI;
	rotator.pitch = -camera.rotation.x*180/Math.PI;
	rotator.roll = -camera.rotation.z*180/Math.PI;
	rotator.updateRotMtx();
	renderer.render(scene, camera);
};
// --------- resize
function onWindowResize(){
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('orientationchange', onWindowResize);
window.addEventListener('resize', onWindowResize, false);
