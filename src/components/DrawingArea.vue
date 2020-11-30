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
    onResize: function () {
      let maxWidth = this.$vnode.elm.offsetWidth;
      let maxHeight = this.$vnode.elm.offsetHeight;

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

      if (this.drawingState.action == DRAWING_STATES.None) {
        switch (newDrawingStateAction) {
          case DRAWING_STATES.Freehand:
          case DRAWING_STATES.Line: {
            this.drawingState.action = newDrawingStateAction;
            let stroke = new Stroke(newDrawingStateAction);
            let currentPosition = this.convertPositionFromCanvasToRelative(this.getMouseCanvasPosition(event));
            this.drawingState.activeStroke = stroke;
            stroke.positions.push(currentPosition);
            break;
          }
        }
      }
    },
    canvasMouseUp(event) {
      let mouseButtons = this.resolveMouseButtons(event);
      this.uiState.leftMouseDown = mouseButtons.isPrimaryButtonPressed;
      let newDrawingStateAction = this.resolveDrawingStateAction();
      if (newDrawingStateAction == DRAWING_STATES.None) {
        switch (this.drawingState.action) {
          case DRAWING_STATES.Freehand:
          case DRAWING_STATES.Line: {
            this.drawingState.action = newDrawingStateAction;
            this.drawingState.existingStrokes.push(this.drawingState.activeStroke);
            this.drawingState.activeStroke = null;
            window.requestAnimationFrame(this.redraw);
            break;
          }
        }
      }
    },
    canvasMouseMove: function(event) {
      let newMouseButtonState = this.resolveMouseButtons(event);
      if (this.uiState.leftMouseDown != newMouseButtonState.isPrimaryButtonPressed) {
        this.canvasMouseUp(event);
      }

      switch (this.drawingState.action) {
        case DRAWING_STATES.Freehand:
        case DRAWING_STATES.Line: {
          let newRelativePosition = this.convertPositionFromCanvasToRelative(this.getMouseCanvasPosition(event));
          this.drawingState.activeStroke.positions.push(newRelativePosition);
          window.requestAnimationFrame(this.redrawTemp);
          break;
        }
      }
    },
    keyAction: function(event) {
      console.log(event);

      if (event.repeat) {
        return;
      }

      let isDown = event.type == "keydown";
      let isShiftKey = event.key == KeyCode.VALUE_SHIFT;

      let keyLower = event.key.toLowerCase();

      if (isShiftKey) {
        this.uiState.shiftPressed = isDown;
      }

      let newDrawingStateAction = this.resolveDrawingStateAction();

      switch (newDrawingStateAction) {
        case DRAWING_STATES.Freehand:
        case DRAWING_STATES.Line:
          this.drawingState.action = newDrawingStateAction;
          this.setActiveStrokeDrawingState(newDrawingStateAction);
          window.requestAnimationFrame(this.redraw);
          break;
      }

      if (isDown && (keyLower == KeyCode.VALUE_Z) && (event.ctrlKey)) {
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
    redrawCanvas: function(canvas, strokes) {
      let ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

      if (strokes == null) {
        return;
      }

      if (!Array.isArray(strokes)) {
        strokes = [strokes];
      }

      ctx.beginPath();
      strokes.forEach((stroke) => {
        let [firstRelativePosition, ...restRelativePositions] = stroke.positions;
        let firstCanvasPosition = this.convertPositionFromRelativeToCanvas(firstRelativePosition);
        let lastCanvasPosition = this.convertPositionFromRelativeToCanvas(stroke.positions.lastItem);
        if (stroke.drawingState == DRAWING_STATES.Freehand) {
          ctx.moveTo(firstCanvasPosition.x, firstCanvasPosition.y);
          restRelativePositions.forEach((currentRelativePosition) => {
            let currentCanvasPosition = this.convertPositionFromRelativeToCanvas(currentRelativePosition);
            ctx.lineTo(currentCanvasPosition.x, currentCanvasPosition.y);
          });
          ctx.stroke();
        }
        else if (stroke.drawingState == DRAWING_STATES.Line) {
          ctx.moveTo(firstCanvasPosition.x, firstCanvasPosition.y);
          ctx.lineTo(lastCanvasPosition.x, lastCanvasPosition.y);
          ctx.stroke();
        }
      });
    },
    redrawMain: function() {
      this.redrawCanvas(this.canvas, this.drawingState.existingStrokes);
      console.log("RedrawMain finished");
    },
    redrawTemp: function() {
      this.redrawCanvas(this.tempCanvas, this.drawingState.activeStroke);
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
    object-fit: contain;
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