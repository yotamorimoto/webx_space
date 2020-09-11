let mobile=false;
if(
	  navigator.userAgent.match(/Android/i)
 || navigator.userAgent.match(/webOS/i)
 || navigator.userAgent.match(/iPhone/i)
 || navigator.userAgent.match(/iPad/i)
 || navigator.userAgent.match(/iPod/i)
 || navigator.userAgent.match(/BlackBerry/i)
 || navigator.userAgent.match(/Windows Phone/i)
){mobile=true};

// if(mobile){
// 	alert('映像のみの再生となります。VR音響はデスクトップ環境をご利用下さい。');
// }
var controls;

const gl = document.getElementById('gl');

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xdddddd );
scene.fog = new THREE.FogExp2( 0xffffff, 0.002 );

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1100);
camera.position.x = 0;
camera.position.y = 0;
camera.position.z = 10;
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
		// controls.autoRotateSpeed = 0.2;
		controls.autoRotate = true;
		// controls.enableZoom = false;
	}
	// askFullscreen();
	hide();
	loop();
});
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

// --------- audio
// var audioContext = new AudioContext();
// var foaRenderer = Omnitone.createFOARenderer(audioContext);
// var audio = audioContext.createMediaElementSource(video);
// foaRenderer.initialize().then(function() {
//   audio.connect(foaRenderer.input);
//   foaRenderer.output.connect(audioContext.destination);
// });

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
	new THREE.CylinderBufferGeometry( 0, 10, 30, 4, 1 ),
	new THREE.BoxGeometry( 10, 10, 10 ),
	new THREE.ConeGeometry( 5, 20, 32 ),
	new THREE.CylinderGeometry( 5, 5, 20, 32 ),
	new THREE.DodecahedronGeometry(10, 0),
	new THREE.DodecahedronGeometry(10, 0),
	new THREE.OctahedronGeometry(10, 0),
	new THREE.RingGeometry( 1, 5, 32 ),
	new THREE.SphereGeometry( 5, 32, 32 ),
	new THREE.TetrahedronGeometry(10, 0),
	new THREE.TorusGeometry( 10, 3, 6, 3 ),
	new THREE.TorusKnotGeometry( 9, 2, 8, 3, 2, 3 )
];
// var material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
var material = new THREE.MeshToonMaterial({ color: 0x99aabb });

for (var i=0; i<500; i++) {
	var mesh = new THREE.Mesh(
		chooseFrom(geometry),
		material
	);
	mesh.position.x = Math.random() * 1000 - 500;
	mesh.position.y = Math.random() * 1000 - 500;
	mesh.position.z = Math.random() * 1000 - 500;
	mesh.updateMatrix();
	scene.add( mesh );
}
// --------- lights
var light = new THREE.DirectionalLight( 0xffffff );
light.position.set( 1, 1, 1 );
scene.add( light );
var light = new THREE.DirectionalLight( 0x002288 );
light.position.set( - 1, - 1, - 1 );
scene.add( light );
var light = new THREE.AmbientLight( 0x222222 );
scene.add( light );

function hide(){
	// let buffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
	// let dummy = audioContext.createBufferSource();
	// dummy.buffer = buffer;
	// dummy.connect(audioContext.destination);
	// dummy.start(0);
	document.getElementById('play').remove();
	// controls.autoRotate = true;
	// audioContext.resume();
	// video.play();
	// if(mobile){
	// 	document.getElementById('text').style.color = 'transparent';
	// 	document.getElementById('text').style.backgroundColor = 'transparent';
	// }
}

function loop(){
	requestAnimationFrame(loop);
	controls.update();
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
