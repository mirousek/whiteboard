<template>
<!--  <div class="drawingAreaWrapper" v-on:resize="$emit('onResize', innerWidth, innerHeight)">-->
  <div class="drawingAreaWrapper">
    <div id="toolsArea">
      <ul class="drawingToolsList">
        <li v-for="tool in drawingTools" v-bind:key="tool.value" :class="(drawingToolsState.activeTool == tool) && 'selected'" class="drawingTool">
          {{tool.name}}
        </li>
      </ul>
      <ul class="drawingStatesList">
        <li v-for="state in drawingStates" v-bind:key="state.value" :class="(drawingState.action == state) && 'selected'">
          {{state.name}}
        </li>
      </ul>
    </div>
    <div id="canvasArea">
      <canvas
          id="mainCanvas"
          ref="mainCanvas"
          :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px'}"
          :width="canvasWidth"
          :height="canvasHeight"
      />
      <canvas
          id="tempCanvas"
          ref="tempCanvas"
          :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px'}"
          :width="canvasWidth"
          :height="canvasHeight"
          v-on:mousedown="canvasMouseDown"
          v-on:mousemove="canvasMouseMove"
          v-on:mouseup="canvasMouseUp"
          v-on:mouseout="canvasMouseOut"
      />
    </div>
  </div>
</template>

<script>
import "core-js/features/array";
import * as KeyCode from "keycode-js"
import "@/scripts/helpers"

const DRAWING_STATES = Object.deepFreeze({
  None: {value: 1, name: "None"},
  Freehand: {value: 2, name: "Freehand"},
  Line: {value: 3, name: "Line"},
});

export const DRAWING_TOOLS = Object.deepFreeze({
  Freehand: {value: 1, name: "Freehand"},
});

class Position {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  x;
  y;
}

// class Size {
//   constructor(w, h) {
//     this.w = w;
//     this.h = h;
//   }
//
//   w;
//   h;
// }

class Stroke {
  constructor(drawingState) {
    this.drawingState = drawingState;
  }

  drawingState = DRAWING_STATES.None;
  positions = [];
}

class MouseButtons {
  isPrimaryButtonPressed;
  isSecondaryButtonPressed;
  isAuxiliaryButtonPressed;
  isFourthButtonPressed;
  isFifthButtonPressed;

  constructor(isPrimaryButtonPressed, isSecondaryButtonPressed, isAuxiliaryButtonPressed, isFourthButtonPressed, isFifthButtonPressed) {
    this.isPrimaryButtonPressed = isPrimaryButtonPressed;
    this.isSecondaryButtonPressed = isSecondaryButtonPressed;
    this.isAuxiliaryButtonPressed = isAuxiliaryButtonPressed;
    this.isFourthButtonPressed = isFourthButtonPressed;
    this.isFifthButtonPressed = isFifthButtonPressed;

  }
}

export default {
  name: "DrawingArea",
  data: () => {
    return {
      canvasWidth: 300,
      canvasHeight: 150,
      ASPECT_RATIO: 16 / 9,

      drawingToolsState: {
        activeTool: DRAWING_TOOLS.Freehand,
      },

      drawingState: {
        action: DRAWING_STATES.None,
        // oldPosition: new Position(0, 0),
        activeStroke: null,
        existingStrokes: [],
      },

      uiState: {
        shiftPressed: false,
        ctrlPressed: false,
        altPressed: false,
        leftMouseDown: false,
      },

      canvas: null,
      tempCanvas: null,
    }
  },
  methods: {
    getMouseCanvasPosition: function(event) {
      return new Position (event.clientX - this.tempCanvas.offsetLeft, event.clientY - this.tempCanvas.offsetTop);
    },
    onResize2: function() {
      console.log("onResize");
      let maxWidth = this.$vnode.elm.offsetWidth;
      let maxHeight = this.$vnode.elm.offsetHeight;

      // console.log(this);
      // console.clear();

      let canvasMaxWidth = maxHeight * this.ASPECT_RATIO;
      let canvasMaxHeight = maxWidth / this.ASPECT_RATIO;

      if (canvasMaxHeight > maxHeight) {
        canvasMaxHeight = maxHeight;
      }
      if (canvasMaxWidth > maxWidth) {
        canvasMaxWidth = maxWidth;
      }

      // console.log("Area size: " + maxWidth + " x " + maxHeight + "  ==> Canvas size: " + canvasMaxWidth + ", " + canvasMaxHeight);

      this.canvasWidth = canvasMaxWidth;
      this.canvasHeight = canvasMaxHeight;

      console.log("onResize finished");
      window.requestAnimationFrame(this.redraw);
    },
    onResize: function () {
      // window.requestAnimationFrame(this.onResize2);
      // return;

      console.log("onResize");
      let maxWidth = this.$vnode.elm.offsetWidth;
      let maxHeight = this.$vnode.elm.offsetHeight;

      // console.log(this);
      // console.clear();

      let canvasMaxWidth = maxHeight * this.ASPECT_RATIO;
      let canvasMaxHeight = maxWidth / this.ASPECT_RATIO;

      if (canvasMaxHeight > maxHeight) {
        canvasMaxHeight = maxHeight;
      }
      if (canvasMaxWidth > maxWidth) {
        canvasMaxWidth = maxWidth;
      }

      this.canvasWidth = canvasMaxWidth;
      this.canvasHeight = canvasMaxHeight;

      console.log("onResize finished");

      window.requestAnimationFrame(this.redraw);
    },
    resolveDrawingStateAction: function() {
      console.log(this.drawingToolsState.activeTool);
      console.log(this.uiState.shiftPressed);

      switch (this.drawingToolsState.activeTool) {
        case DRAWING_TOOLS.Freehand:
          if (this.uiState.leftMouseDown) {
            if (this.uiState.shiftPressed) {
              console.log("DRAWING_STATES.Line");
              return DRAWING_STATES.Line;
            } else {
              console.log("DRAWING_STATES.Freehand");
              return DRAWING_STATES.Freehand;
            }
          }
          break;
      }

      console.log("DRAWING_STATES.None");
      return DRAWING_STATES.None;
    },
    canvasMouseDown: function(event) {
      let newMouseButtonState = this.resolveMouseButtons(event);
      this.uiState.leftMouseDown = newMouseButtonState.isPrimaryButtonPressed;
      let newDrawingStateAction = this.resolveDrawingStateAction();
      // console.log(event);

      if ((this.drawingState.action == DRAWING_STATES.None) && (newDrawingStateAction == DRAWING_STATES.Freehand)) {
        this.drawingState.action = newDrawingStateAction;
        let stroke = new Stroke(newDrawingStateAction);
        let currentPosition = this.convertPositionFromCanvasToRelative(this.getMouseCanvasPosition(event));
        this.drawingState.activeStroke = stroke;
        this.drawingState.existingStrokes.push(stroke);
        stroke.positions.push(currentPosition);
      }
      else if ((this.drawingState.action == DRAWING_STATES.None) && (newDrawingStateAction == DRAWING_STATES.Line)) {
        this.drawingState.action = newDrawingStateAction;
        let stroke = new Stroke(newDrawingStateAction);
        let currentPosition = this.convertPositionFromCanvasToRelative(this.getMouseCanvasPosition(event));
        this.drawingState.activeStroke = stroke;
        this.drawingState.existingStrokes.push(stroke);
        stroke.positions.push(currentPosition);
      }
      // else {
      //   let ctx = this.canvas.getContext("2d");
      //   ctx.moveTo(this.drawingState.oldPosition.x, this.drawingState.oldPosition.y);
      // }
    },
    canvasMouseUp(event) {
      let mouseButtons = this.resolveMouseButtons(event);
      this.uiState.leftMouseDown = mouseButtons.isPrimaryButtonPressed;
      let newDrawingStateAction = this.resolveDrawingStateAction();
      if ((this.drawingState.action == DRAWING_STATES.Freehand) && (newDrawingStateAction == DRAWING_STATES.None)) {
        this.drawingState.action = newDrawingStateAction;
      }
      else if ((this.drawingState.action == DRAWING_STATES.Line) && (newDrawingStateAction == DRAWING_STATES.None)) {
        this.drawingState.action = newDrawingStateAction;
      }
      window.requestAnimationFrame(this.redraw);
    },
    canvasMouseOut() {
      this.uiState.leftMouseDown = false;
      let newDrawingStateAction = this.resolveDrawingStateAction();
      if ((this.drawingState.action == DRAWING_STATES.Freehand) && (newDrawingStateAction == DRAWING_STATES.None)) {
        this.drawingState.action = newDrawingStateAction;
      }
      else if ((this.drawingState.action == DRAWING_STATES.Line) && (newDrawingStateAction == DRAWING_STATES.None)) {
        this.drawingState.action = newDrawingStateAction;
      }
      window.requestAnimationFrame(this.redraw);
    },
    canvasMouseMove: function(event) {
      let newMouseButtonState = this.resolveMouseButtons(event);
      if (this.uiState.leftMouseDown != newMouseButtonState.isPrimaryButtonPressed) {
        this.canvasMouseUp(event);
      }

      console.log(event);
      // let newDrawingStateAction = this.resolveDrawingStateAction();
      if ((this.drawingState.action == DRAWING_STATES.Freehand)) {
        let newRelativePosition = this.convertPositionFromCanvasToRelative(this.getMouseCanvasPosition(event));
        let newCanvasPosition = this.convertPositionFromRelativeToCanvas(newRelativePosition);
        let ctx = this.canvas.getContext("2d");
        ctx.beginPath();
        let lastCanvasPosition = this.convertPositionFromRelativeToCanvas(this.drawingState.activeStroke.positions.lastItem);
        ctx.moveTo(lastCanvasPosition.x, lastCanvasPosition.y);
        this.drawingState.activeStroke.positions.push(newRelativePosition);
        ctx.lineTo(newCanvasPosition.x, newCanvasPosition.y);
        ctx.stroke();
        ctx.closePath();
      }
      else if ((this.drawingState.action == DRAWING_STATES.Line)) {
        let newRelativePosition = this.convertPositionFromCanvasToRelative(this.getMouseCanvasPosition(event));
        // let newCanvasPosition = this.convertPositionFromRelativeToCanvas(newRelativePosition);
        // let ctx = this.canvas.getContext("2d");
        // ctx.beginPath();
        // let lastCanvasPosition = this.convertPositionFromRelativeToCanvas(this.drawingState.activeStroke.positions.lastItem);
        // ctx.moveTo(lastCanvasPosition.x, lastCanvasPosition.y);
        this.drawingState.activeStroke.positions.push(newRelativePosition);
        // ctx.lineTo(newCanvasPosition.x, newCanvasPosition.y);
        // ctx.stroke();
        // ctx.closePath();
        window.requestAnimationFrame(this.redraw);
      }
    },
    keyAction: function(event) {
      console.log(event);

      if (event.repeat) {
        return;
      }

      let isDown = event.type == "keydown";
      // let key = event.key;
      // let keyCode = event.keyCode;
      let isShiftKey = event.key == KeyCode.VALUE_SHIFT;

      let keyLower = event.key.toLowerCase();

      // if (!Array.isArray(keysDown)) {
      //   keyDown = keysDown;
      // }
      // else if (keysDown.length == 1) {
      //   keyDown = keysDown[0];
      // }

      // if (!Array.isArray(keysUp)) {
      //   keyUp = keysUp;
      // }
      // else if (keysUp.length == 1) {
      //   keyUp = keysUp[0];
      // }

      if (isShiftKey) {
        this.uiState.shiftPressed = isDown;
      }

      let newDrawingStateAction = this.resolveDrawingStateAction();
      if ((this.drawingState.action == DRAWING_STATES.Freehand) && (newDrawingStateAction == DRAWING_STATES.Line)) {
        this.drawingState.action = newDrawingStateAction;
        this.setActiveStrokeDrawingState(newDrawingStateAction);
        window.requestAnimationFrame(this.redraw);
      }
      else if ((this.drawingState.action == DRAWING_STATES.Line) && (newDrawingStateAction == DRAWING_STATES.Freehand)) {
        this.drawingState.action = newDrawingStateAction;
        this.setActiveStrokeDrawingState(newDrawingStateAction);
        window.requestAnimationFrame(this.redraw);
      }
      else if (isDown && (keyLower == KeyCode.VALUE_Z) && (event.ctrlKey)) {
        if (this.drawingState.action == DRAWING_STATES.None) {
          this.drawingState.existingStrokes.pop();
          window.requestAnimationFrame(this.redraw);
        }
      }
    },
    setActiveStrokeDrawingState(drawingState) {
      this.drawingState.activeStroke.drawingState = drawingState;
    },
    redraw: function() {
      this.redrawMain();
      this.redrawTemp();
    },
    redrawMain: function() {
      // console.log("RedrawMain");
      let ctx = this.canvas.getContext("2d");
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      ctx.beginPath();
      // let strokeNum = 1;
      this.drawingState.existingStrokes.forEach((stroke) => {
        let firstCanvasPosition = this.convertPositionFromRelativeToCanvas(stroke.positions[0]);
        let lastCanvasPosition = this.convertPositionFromRelativeToCanvas(stroke.positions.lastItem);
        if (stroke.drawingState == DRAWING_STATES.Freehand) {
          ctx.moveTo(firstCanvasPosition.x, firstCanvasPosition.y);
          stroke.positions.slice(1).forEach((currentRelativePosition) => {
            let currentCanvasPosition = this.convertPositionFromRelativeToCanvas(currentRelativePosition);
            ctx.lineTo(currentCanvasPosition.x, currentCanvasPosition.y);
          });
          ctx.stroke();
        }
        else if (stroke.drawingState == DRAWING_STATES.Line) {
          if (this.drawingState.activeStroke == stroke) {
            // Temp only
          }
          else {
            ctx.moveTo(firstCanvasPosition.x, firstCanvasPosition.y);
            ctx.lineTo(lastCanvasPosition.x, lastCanvasPosition.y);
            ctx.moveTo(firstCanvasPosition.x, firstCanvasPosition.y);
            ctx.lineTo(lastCanvasPosition.x, lastCanvasPosition.y);
            ctx.stroke();
          }
        }
      })
      console.log("RedrawMain finished");
    },
    redrawTemp: function() {
      // console.log("RedrawTemp");
      let tempCtx = this.tempCanvas.getContext("2d");
      tempCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      tempCtx.beginPath();
      // let strokeNum = 1;
      this.drawingState.existingStrokes.forEach((stroke) => {
        // console.log("Stroke #" + strokeNum + ": Action: " + stroke.drawingState + " Positions: " + stroke.positions.length);
        // strokeNum++;
        let firstCanvasPosition = this.convertPositionFromRelativeToCanvas(stroke.positions[0]);
        let lastCanvasPosition = this.convertPositionFromRelativeToCanvas(stroke.positions.lastItem);
        if (stroke.drawingState == DRAWING_STATES.Freehand) {
          // Main only
        }
        else if (stroke.drawingState == DRAWING_STATES.Line) {
          if (this.drawingState.activeStroke == stroke) {
            tempCtx.moveTo(firstCanvasPosition.x, firstCanvasPosition.y);
            tempCtx.lineTo(lastCanvasPosition.x, lastCanvasPosition.y);
            tempCtx.moveTo(firstCanvasPosition.x, firstCanvasPosition.y);
            tempCtx.lineTo(lastCanvasPosition.x, lastCanvasPosition.y);
            tempCtx.stroke();
          }
        }
      })
      // ctx.beginPath();
      // ctx.moveTo(0, 0);
      // ctx.lineTo(20, 20);
      // ctx.stroke();
      // ctx.closePath();
      console.log("RedrawTemp finished");
    },
    convertPositionFromCanvasToRelative(canvasPosition) {
      let xRel = canvasPosition.x / this.canvasWidth;
      let yRel = canvasPosition.y / this.canvasHeight;

      return new Position(xRel, yRel);
    },
    convertPositionFromRelativeToCanvas(relativePosition) {
      let xCan = relativePosition.x * this.canvasWidth;
      let yCan = relativePosition.y * this.canvasHeight;

      return new Position(xCan, yCan);
    },
    resolveMouseButtons(event) {
      return new MouseButtons(event.buttons & 1, event.buttons & 4, event.buttons & 2, event.buttons & 8, event.buttons & 16);
    }
  },
  // computed: {
  //   keymap() {
  //     return {
  //       "shift": {
  //         keydown: () => {this.keyAction([KeyCode.KEY_SHIFT], null)},
  //         keyup: () => {this.keyAction([], [KeyCode.KEY_SHIFT])},
  //       },
  //       "a": this.keyAction,
  //     };
  //   },
  // },
  computed: {
    drawingStates: () => DRAWING_STATES,
    drawingTools: () => DRAWING_TOOLS,
  },
  mounted() {
    this.canvas = this.$refs.mainCanvas;
    this.tempCanvas = this.$refs.tempCanvas;
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.keyAction);
    window.addEventListener("keyup", this.keyAction);
    this.onResize();
    // console.log(this);
  }
}
</script>

<style scoped>
  .drawingAreaWrapper {
    /*border: solid 1px red;*/
    /*overflow: visible;*/
    display: flex;
    background-color: cyan;
    justify-content: left;
    overflow: hidden;
  }

  #canvasArea {
    display: flex;
    justify-content: center;
    flex-grow: 1;
  }

  canvas {
    /*border: solid 1px black;*/
    object-fit: contain;
    /*background-color: red;*/
    /*border: solid 2px #dadcda;*/
    display: block;
    position: absolute;
  }

  canvas#mainCanvas {
    background-color: red;
  }

  #toolsArea .drawingToolsList li,
  #toolsArea .drawingStatesList li {
    list-style-type: none;
    text-align: left;
  }

  #toolsArea .drawingToolsList,
  #toolsArea .drawingStatesList {
    padding-inline-start: 0px;
  }

  #toolsArea li.selected {
    font-weight: bold;
  }
</style>