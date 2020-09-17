const numGrain =  77;
const ampFactor = Math.sqrt(1/numGrain);
const maxOrder = 3;
var context, sound=[],lo=[],hi=[];
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

// if(mobile){
// 	alert('映像のみの再生となります。VR音響はデスクトップ環境をご利用下さい。');
// }

const gl = document.getElementById('gl');
const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xccccde );
scene.fog = new THREE.FogExp2(0xaaaaef, 0.1);

// --------- camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 1;
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
		// controls.autoRotate = true;
		// controls.enableZoom = false;
		// camera.position.z = 0; // ????
	}
	// askFullscreen();
	load();
	hide();
});
function loadSound(url) {
	return fetch(url)
	.then(data => data.arrayBuffer())
	.then(arrayBuffer => context.decodeAudioData(arrayBuffer))
	.then(decodedBuffer => { sound.push(decodedBuffer) })
	;
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
	Promise.all([
		loadSound('2.mp3'),
		loadSound('9.mp3'),
		loadSound('11.mp3')
	]).then(play);
}
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
// --------- lights
var light = new THREE.DirectionalLight( 0xffffff );
light.position.set( 1, 2, 3 );
scene.add( light );
light = new THREE.DirectionalLight( 0x888888 );
light.position.set( 3, 2, 1 );
scene.add( light );
light = new THREE.AmbientLight( 0x222222 );
scene.add( light );

function play() {
	for (let i=0; i<numGrain; i++) {
		obj.push(new THREE.Mesh(chooseFrom(geometry), material));
		enc.push(new ambisonics.monoEncoder(context, maxOrder));
		vec3.push(new THREE.Vector3(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1));
		obj[i].position.x = vec3[i].x;
		obj[i].position.y = vec3[i].y;
		obj[i].position.z = vec3[i].z;
		obj[i].rotation.x = obj[i].rotation.y = obj[i].rotation.z = Math.random()*2-1;
		obj[i].scale.x = obj[i].scale.y = obj[i].scale.z = Math.random()*0.04+0.03;
		obj[i].updateMatrix();
		scene.add(obj[i]);
		let node = context.createBufferSource();
		let s    = new THREE.Spherical();
		let d    = Math.max(vec3[i].distanceTo(camera.position), 0.1);
		lo.push(context.createBiquadFilter());
		lo[i].type  = 'lowshelf';
		lo[i].frequency = 150;
		lo[i].gain.value = 0;
		s.setFromVector3(vec3[i]);
		amp.push(context.createGain());
		node.buffer = chooseFrom(sound);
		node.loop = true;
		node.playbackRate.value = chooseFrom([0.125, 0.25, 0.5, 1.0, 4/3, 1/1.5, 1.5]);
		node.connect(amp[i]);
		amp[i].connect(enc[i].in);
		amp[i].gain.value =  1/d * ampFactor;
		lo[i].gain.value = 6-d;
		enc[i].azim = s.phi*180;
		enc[i].elev = s.theta*180;
		enc[i].out.connect(rotator.in);
		enc[i].updateGains();
		rotator.out.connect(decoder.in);
		node.start();
	}
	loop();
}
function loop(){
	var t = 0.0001 * Date.now();
	requestAnimationFrame(loop);
	for (let i=0; i<numGrain; i++) {
		let o = obj[i];
		let d = Math.max(vec3[i].distanceTo(camera.position), 0.1);
		let s = new THREE.Spherical();
		vec3[i].x = Math.cos(t+i);
		vec3[i].y = Math.sin(t+i*1.1);
		vec3[i].z = Math.sin(t+i*1.789);
		o.position.x = vec3[i].x * 2;
		o.position.y = vec3[i].y * 2;
		o.updateMatrix();
		s.setFromVector3(vec3[i]);
		amp[i].gain.value = 1/d * ampFactor;
		lo[i].gain.value = 6-d;
		enc[i].azim = s.phi*180/Math.PI;
		enc[i].elev = s.theta*180/Math.PI;
		enc[i].updateGains();
	}
	controls.update();
	rotator.yaw = camera.rotation.y*180/Math.PI;
	rotator.pitch = camera.rotation.x*180/Math.PI;
	rotator.roll = camera.rotation.z*180/Math.PI;
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

function hide(){
	document.getElementById('play').remove();
	// if(mobile){
	// 	document.getElementById('text').style.color = 'transparent';
	// 	document.getElementById('text').style.backgroundColor = 'transparent';
	// }
}
// --------- resize
function onWindowResize(){
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('orientationchange', onWindowResize);
window.addEventListener('resize', onWindowResize, false);
