import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Vertex from "./shaders/vertex.glsl";
import Fragment from "./shaders/fragment.glsl";
import particleTexture from "./static/particle.png";

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

export default class Sketch {
  constructor(options) {
    this.container = options.domElement;
    this.height = this.container.offsetHeight;
    this.width = this.container.offsetWidth;
    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      10
    );
    this.camera.position.set(0, 2, 2);

    this.scene = new THREE.Scene();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.point = new THREE.Vector3();

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    this.time = 0;

    this.materials = [];

    let ops = [
      {
        min_radius: 0.5,
        max_radius: 1.5,
        color: "#f7b373",
        size: 1,
      },
      {
        min_radius: 0.5,
        max_radius: 1.5,
        color: "#88b3ce",
        size: 0.5,
      },
    ];

    ops.forEach((option) => {
      this.addObject(option);
    });

    this.raycasterEvent();
    this.resize();
    this.render();
    this.setUpResize();
  }

  raycasterEvent() {
    let mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10, 10, 10).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
    );

    let test = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
    );
    window.addEventListener("pointermove", (event) => {
      this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);

      const intersects = this.raycaster.intersectObjects([mesh]);

      if (intersects[0]) {
        this.point.copy(intersects[0].point);
        test.position.copy(intersects[0].point);
      }
    });
  }

  addObject(option) {
    const count = 10000;
    const min_radius = option.min_radius;
    const max_radius = option.max_radius;
    const particleGeo = new THREE.PlaneGeometry(1, 1);
    const geo = new THREE.InstancedBufferGeometry();
    geo.instanceCount = count;
    geo.setAttribute("position", particleGeo.getAttribute("position"));
    geo.index = particleGeo.index;

    let pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      let theta = Math.random() * 2 * Math.PI;
      let r = lerp(min_radius, max_radius, Math.random());
      let x = r * Math.sin(theta);
      let y = (Math.random() - 0.5) * 0.1;
      let z = r * Math.cos(theta);
      pos.set([x, y, z], i * 3);
    }

    geo.setAttribute("pos", new THREE.InstancedBufferAttribute(pos, 3, false));
    let material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: new THREE.TextureLoader().load(particleTexture) },
        uTime: { value: 0.0 },
        uSize: { value: option.size },
        uMouse: { value: new THREE.Vector3() },
        uColor: { value: new THREE.Color(option.color) },
        uResolution: { value: new THREE.Vector2() },
      },
      vertexShader: Vertex,
      fragmentShader: Fragment,
      transparent: true,
      depthTest: false,
    });
    this.materials.push(material);
    this.mesh = new THREE.Mesh(geo, material);
    this.scene.add(this.mesh);
  }

  render() {
    this.time += 0.05;
    this.materials.forEach((material) => {
      material.uniforms.uTime.value = this.time * 0.3;
      material.uniforms.uMouse.value = this.point;
    });

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.render.bind(this));
  }

  setUpResize() {
    addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }
}

new Sketch({
  domElement: document.getElementById("container"),
});
