import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import "@babylonjs/core/Debug/debugLayer";
import {
  Inspector,
} from "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
import {
  Engine, Scene,
  FreeCamera,
  DynamicTexture,
  HemisphericLight,
  Mesh, MeshBuilder,
  StandardMaterial,
  Vector3,
  Color3, Color4,
  UtilityLayerRenderer,
  Quaternion,
  Animation,
  ActionManager,
  ExecuteCodeAction, 
	SetValueAction,
  PointerEventTypes,
} from "@babylonjs/core";
import {
  GUI3DManager,
  AdvancedDynamicTexture,
  StackPanel3D, StackPanel,
  HolographicButton, Button3D, Button,
  TextBlock,
  Control,
} from "@babylonjs/gui";
import {
  HtmlMeshRenderer, HtmlMesh,
  FitStrategy
} from "@babylonjs/addons/htmlMesh";
// HTML Content
let mainMenuHTML = '';
try {
  const resHTML = await fetch('/main-menu.html');
  if (!resHTML.ok) throw new Error('Failed to load HTML');
  mainMenuHTML = await resHTML.text();
} catch (err) {
  console.error('Error loading HTML:', err);
}
import './style.css';

class App {
  // Global App
  private _scene: Scene;
  private _canvas: HTMLCanvasElement;
  private _engine: Engine;
  private _gui3dManager: GUI3DManager;

  private _camera: FreeCamera;
  private _light: HemisphericLight;

  // Scene Objects
  private _ball: Mesh;
  private _lpaddle: Mesh;
  private _rpaddle: Mesh;

  private _belowPlane: Mesh;
  private _mainMenuPlane: Mesh;
  private _mainMenuHTML: string = mainMenuHTML;

  // GUI Controls
  private _mainMenu: AdvancedDynamicTexture;
  private _mainMenuPanel: StackPanel;

  // Position
  private _cameraPongPosition: Vector3;
  private _cameraMainMenuPosition: Vector3;

  // Targets
  private _pongTarget: Quaternion;
  private _mainMenuTarget: Quaternion;
  private _currentTarget: Quaternion;

  // Game State


  constructor() {
    // create the canvas html element and attach it to the webpage
    this._canvas = this._createCanvas();

    // initialize babylon this._scene and this._engine
    this._engine = new Engine(this._canvas, true);
    this._scene = new Scene(this._engine);
    this._scene.clearColor = new Color4(0, 0, 0, 0);
    this._scene.createDefaultEnvironment({
      createGround: false,
      skyboxSize: 1000
    });
    this._gui3dManager = new GUI3DManager(this._scene);
    const htmlMeshRenderer = new HtmlMeshRenderer(this._scene);
    const utilLayer = new UtilityLayerRenderer(this._scene);

    // Init Targets
    this._pongTarget = Quaternion.FromEulerAngles(Math.PI, 0, Math.PI); // Front view
    this._mainMenuTarget = Quaternion.FromEulerAngles(Math.PI / 2, Math.PI, 0);
    this._currentTarget = this._mainMenuTarget;

    // Init Positions
    this._cameraPongPosition = new Vector3(0, 0, 3);
    this._cameraMainMenuPosition = new Vector3(0, 3, 3);

    this._camera = new FreeCamera("camera", this._cameraPongPosition, this._scene);
    this._camera.fov = 1.2; // Narrower FOV reduces perspective distortion
    this._camera.rotationQuaternion = Quaternion.FromEulerAngles(0, 0, 0);
    this._camera.setTarget(Vector3.Zero());
    this._camera.attachControl(this._canvas, true);

    this._light = new HemisphericLight("hemisphericLight",
      new Vector3(1, 1, 0),
      this._scene
    );

    // Run the main render loop
    this._main();
  }

  private async _main(): Promise<void> {
    await this._init();

    // Render Loop
    this._engine.runRenderLoop(() => {
      this._scene.render();
    });
  }

  private async _init() {
    // Create Inspector
    Inspector.Show(this._scene, {
      overlay: true,
      enablePopup: true,
    });

    // Create Objects
    this._createObjects();

    /// Event Listeners
    this._setupEvents();
    this.animationCamera(this._currentTarget);
  }

  private _createCanvas(): HTMLCanvasElement {
    // Commented out for development
    document.documentElement.style["overflow"] = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.width = "100%";
    document.documentElement.style.height = "100%";
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.overflow = "hidden";
    document.body.style.width = "100%";
    document.body.style.height = "100%";
    document.body.style.margin = "0";
    document.body.style.padding = "0";

    // Create the canvas html element and attach it to the webpage
    this._canvas = document.createElement("canvas");
    this._canvas.style.width = "100%";
    this._canvas.style.height = "100%";
    this._canvas.id = "gameCanvas";
    document.body.appendChild(this._canvas);

    return this._canvas;
  }

  private _createObjects(): void {
    // Ball
    this._ball = MeshBuilder.CreateSphere("ball", { diameter: .1 }, this._scene);
    this._ball.position = new Vector3(0.1, 0, 0);

    // Paddles
    this._lpaddle = MeshBuilder.CreateBox("lpaddle", { width: .1, height: 0.3, depth: .05 }, this._scene);
    this._rpaddle = MeshBuilder.CreateBox("rpaddle", { width: .1, height: 0.3, depth: .05 }, this._scene);
    this._lpaddle.position = new Vector3(-1.4, 0, 0);
    this._rpaddle.position = new Vector3(1.4, 0, 0);

    // Planes
    // Pong Plane
    const pongPlane = new StandardMaterial("belowPlaneMat", this._scene);
    pongPlane.diffuseColor = new Color3(0, 1, 0); // Green
    this._belowPlane = MeshBuilder.CreatePlane("xyPlane", { size: 7 }, this._scene);
    this._belowPlane.material = pongPlane;
    this._belowPlane.rotation.x = Math.PI; // 180° around the X axis
    this._belowPlane.position.y = -1; // Below the main plane

    // Main Menu
    const htmlMeshDiv = new HtmlMesh(this._scene, "htmlMeshDiv",
      { captureOnPointerEnter: false, isCanvasOverlay: false, fitStrategy: FitStrategy.NONE });
    const div = document.createElement("div");
    div.innerHTML = this._mainMenuHTML
    // div.style.width = "200px";
    // div.style.height = "200px";
    div.style.textAlign = 'center';

    htmlMeshDiv.setContent(div, 4, 2);

    const mainMenuPlaneMat = new StandardMaterial("mainMenuPlaneMat", this._scene);
    mainMenuPlaneMat.diffuseColor = new Color3(0, 0, 0); // Black
    mainMenuPlaneMat.alpha = 0; // Transparent
    this._mainMenuPlane = MeshBuilder.CreatePlane("mainMenuPlane", { size: 7 }, this._scene);
    this._mainMenuPlane.position.set(0.0, -3.1, 2.5); // Adjust as needed
    this._mainMenuPlane.rotation = Quaternion.FromEulerAngles((Math.PI / 2), 0, Math.PI).toEulerAngles();
    this._mainMenuPlane.material = mainMenuPlaneMat;
    htmlMeshDiv.parent = this._mainMenuPlane;
  }

  /**
   * Animates the camera's rotation to a specified target orientation.
   * 
   * @param quat - The target orientation as a Vector3, where x, y, and z represent Euler angles.
   */
  private animationCamera(quat: Quaternion): void {
    let framerate = 50;

    let animateRotation = new Animation(
      "animRotation",
      "rotationQuaternion",
      framerate,
      Animation.ANIMATIONTYPE_QUATERNION,
      Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    let keyframeRotation = [];
    keyframeRotation.push({ frame: 0, value: this._camera.rotationQuaternion.clone() });
    keyframeRotation.push({ frame: 50, value: quat });
    animateRotation.setKeys(keyframeRotation);

    this._scene.stopAnimation(this._camera);

    this._camera.animations = [animateRotation];
    this._scene.beginAnimation(this._camera, 0, 50, false, 2);
  }

  private _setupEvents(): void {
    window.addEventListener("resize", () => {
      this._engine.resize();
    });
    // Paddles
    const paddleSpeed = 0.07;
    const paddleLimit = 0.66;

    function clampPaddle(paddle: Mesh) {
      if (paddle.position.y > paddleLimit) paddle.position.y = paddleLimit;
      if (paddle.position.y < -paddleLimit) paddle.position.y = -paddleLimit;
    }
    window.addEventListener("keydown", (ev) => {
      switch (ev.key) {
        case "ArrowUp":
          this._lpaddle.position.y += paddleSpeed;
          clampPaddle(this._lpaddle);
          break;
        case "ArrowDown":
          this._lpaddle.position.y -= paddleSpeed;
          clampPaddle(this._lpaddle);
          break;
        case "w":
          this._rpaddle.position.y += paddleSpeed;
          clampPaddle(this._rpaddle);
          break;
        case "s":
          this._rpaddle.position.y -= paddleSpeed;
          clampPaddle(this._rpaddle);
          break;
        default:
          break;
      }
    });

    // Camera target switching with spacebar
    window.addEventListener("keydown", (ev) => {
      if (ev.code === "Space") {
        ev.preventDefault(); // Prevent default space behavior
        this._currentTarget =
          this._currentTarget === this._pongTarget
            ? this._mainMenuTarget
            : this._pongTarget;

        this.animationCamera(this._currentTarget);

        if (this._currentTarget === this._pongTarget) {
          this._currentTarget = this._pongTarget;
          this._camera.rotationQuaternion = this._pongTarget;
        } else {
          this._currentTarget = this._mainMenuTarget;
          this._camera.rotationQuaternion = this._mainMenuTarget;
        }

      }
    });

    // Ball
    const ballSpeed = 0.1;

    // hide/show the Inspector
    window.addEventListener("keydown", (ev) => {
      // Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && (ev.key === "I" || ev.key === "i")) {
        if (this._scene.debugLayer.isVisible()) {
          this._scene.debugLayer.hide();
        } else {
          this._scene.debugLayer.show();
        }
      }
    });

    this._scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === PointerEventTypes.POINTERPICK) {
        const pick = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
        if (pick?.pickedMesh?.metadata?.isButton) {
          this._toggleCameraTarget();
        }
      }
    });

    this._mainMenuPlane.actionManager = new ActionManager(this._scene);
    this._mainMenuPlane.actionManager.registerAction(
      new ExecuteCodeAction(
        ActionManager.OnPickTrigger,
        (evt) => {
          const pick = this._scene.pick(this._scene.pointerX, this._scene.pointerY);
          console.log(pick);
          if (pick?.pickedMesh?.metadata?.isButton) {
            this._toggleCameraTarget();
          }
        }
      )
    );
  }

  private _toggleCameraTarget(): void {
    this._currentTarget = this._currentTarget === this._pongTarget
      ? this._mainMenuTarget
      : this._pongTarget;
    this.animationCamera(this._currentTarget);

		if (this._currentTarget === this._pongTarget) {
			this._currentTarget = this._pongTarget;
			this._camera.rotationQuaternion = this._pongTarget;
		} else {
			this._currentTarget = this._mainMenuTarget;
			this._camera.rotationQuaternion = this._mainMenuTarget;
		}
  }

};
new App()


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`
