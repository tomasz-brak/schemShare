import { NbtFile, Structure, StructureRenderer } from "deepslate";
import { mat4, vec3 } from "gl-matrix";
import {
  litematicToStructure,
  schematicToStructure,
  spongeToStructure,
} from "./Schematics";

const document = window.document;

class InteractiveCanvas {
  private xRotation = 0.8;
  private yRotation = 0.5;
  private camera_pos: vec3 = vec3.fromValues(0, 0, 0);
  private renderRequested = false;
  private movement = [0, 0, 0, 0, 0, 0];
  private movmentKeys = ["w", "a", "s", "d", " ", "Shift"];

  // private view: mat4 = mat4.create();

  constructor(
    private canvas: HTMLCanvasElement,
    private renderer: StructureRenderer,
    private readonly onRender: (view: mat4) => void,
    private readonly center?: [number, number, number],
    private viewDist = 4
  ) {
    let dragPos: null | [number, number] = null;
    canvas.addEventListener("mousedown", (evt) => {
      if (evt.button === 0) {
        dragPos = [evt.clientX, evt.clientY];
      }
    });
    canvas.addEventListener("mousemove", (evt) => {
      if (dragPos) {
        this.yRotation += (evt.clientX - dragPos[0]) / 100;
        this.xRotation += (evt.clientY - dragPos[1]) / 100;
        dragPos = [evt.clientX, evt.clientY];
        this.redraw();
      }
    });
    canvas.addEventListener("mouseup", () => {
      dragPos = null;
    });
    canvas.addEventListener("wheel", (evt) => {
      evt.preventDefault();
      this.viewDist += evt.deltaY / 100;
      this.redraw();
    });

    document.addEventListener("keydown", (evt) => {
      const index = this.movmentKeys.indexOf(evt.key);
      if (index !== -1) {
        this.movement[index] = 1;
        this.redraw();
      }
    });

    document.addEventListener("keyup", (evt) => {
      const index = this.movmentKeys.indexOf(evt.key);
      if (index !== -1) {
        this.movement[index] = 0;
        this.redraw();
      }
    });

    this.redraw();
    this.center;
  }

  public redraw() {
    requestAnimationFrame(() => this.render());
  }

  render() {
    if (this.renderRequested) {
      return;
    }
    const requestTime = performance.now();
    this.renderRequested = true;
    requestAnimationFrame((time) => {
      const delta = Math.max(0, time - requestTime);
      this.renderRequested = false;
      this.resize();

      if (this.movement.some((m) => m)) {
        vec3.rotateY(
          this.camera_pos,
          this.camera_pos,
          [0, 0, 0],
          this.yRotation
        );
        const [w, a, s, d, space, shift] = this.movement;
        const move = vec3.fromValues(a - d, shift - space, w - s);
        vec3.scaleAndAdd(this.camera_pos, this.camera_pos, move, delta * 0.02);
        vec3.rotateY(
          this.camera_pos,
          this.camera_pos,
          [0, 0, 0],
          -this.yRotation
        );
        this.render();
      }

      const viewMatrix = this.getViewMatrix();
      this.onRender(viewMatrix);
    });
    this.resize();
  }

  private getViewMatrix() {
    const viewMatrix = mat4.create();
    mat4.translate(viewMatrix, viewMatrix, [0, 0, -this.viewDist]);
    mat4.rotateX(viewMatrix, viewMatrix, this.xRotation);
    mat4.rotateY(viewMatrix, viewMatrix, this.yRotation);
    mat4.translate(viewMatrix, viewMatrix, this.camera_pos);
    return viewMatrix;
  }
  resize() {
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    if (
      this.canvas.width !== displayWidth ||
      this.canvas.height !== displayHeight
    ) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.renderer.setViewport(0, 0, this.canvas.width, this.canvas.height);
      return true;
    }
    return false;
  }
}

async function loadStructure(nbt: NbtFile) {
  if (
    nbt.root.get("BlockData")?.isByteArray() &&
    nbt.root.hasCompound("Palette")
  ) {
    return spongeToStructure(nbt.root);
  }
  if (nbt.root.hasCompound("Regions")) {
    return litematicToStructure(nbt.root);
  }
  if (
    nbt.root.get("Blocks")?.isByteArray() &&
    nbt.root.get("Data")?.isByteArray()
  ) {
    return schematicToStructure(nbt.root);
  }
  return Structure.fromNbt(nbt.root);
}

export { InteractiveCanvas, loadStructure };
