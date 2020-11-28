<template>
<!--  <div class="drawingAreaWrapper" v-on:resize="$emit('onResize', innerWidth, innerHeight)">-->
  <div class="drawingAreaWrapper">
    <canvas
        id="mainCanvas"
        ref="mainCanvas"
        :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px'}"
        :width="canvasWidth"
        :height="canvasHeight"
        v-on:mousedown="canvasMouseDown"
        v-on:mousemove="canvasMouseMove"
        v-on:mouseup="canvasMouseUp"
        v-on:mouseout="canvasMouseOut"
    /></div>
<!--    <canvas id="mainCanvas" /></div>-->
</template>

<script>
import "core-js";
import "v-hotkey";

const DRAWING_STATES = Object.freeze({
  None: 1,
  Line: 2
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
  positions = [];
}

export default {
  name: "DrawingArea",
  data: () => {
    return {
      canvasWidth: 300,
      canvasHeight: 150,
      ASPECT_RATIO: 16 / 9,

      drawingState: {
        action: DRAWING_STATES.None,
        // oldPosition: new Position(0, 0),
        activeStroke: null,
        existingStrokes: [],
      },

      canvas: null,
    }
  },
  methods: {
    getMouseCanvasPosition: function(event) {
      return new Position (event.clientX - this.canvas.offsetLeft, event.clientY - this.canvas.offsetTop);
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
      this.redraw();
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

      // console.log("Area size: " + maxWidth + " x " + maxHeight + "  ==> Canvas size: " + canvasMaxWidth + ", " + canvasMaxHeight);

      this.canvasWidth = canvasMaxWidth;
      this.canvasHeight = canvasMaxHeight;

      console.log("onResize finished");
      // this.redraw();

      window.requestAnimationFrame(this.redraw);
      // window.setTimeout(this.redraw, 100);
    },
    canvasMouseDown: function(event) {
      // console.log(event);

      if (this.drawingState.action == DRAWING_STATES.None) {
        this.drawingState.action = DRAWING_STATES.Line;
        let stroke = new Stroke();
        let currentPosition = this.convertPositionFromCanvasToRelative(this.getMouseCanvasPosition(event));
        this.drawingState.activeStroke = stroke;
        this.drawingState.existingStrokes.push(stroke);
        stroke.positions.push(currentPosition);
        // this.drawingState.oldPosition = this.getMouseCanvasPosition(event);
        // this.drawingState.activePath
      }
      // else {
      //   let ctx = this.canvas.getContext("2d");
      //   ctx.moveTo(this.drawingState.oldPosition.x, this.drawingState.oldPosition.y);
      // }
    },
    canvasMouseUp() {
      if (this.drawingState.action == DRAWING_STATES.Line) {
        this.drawingState.action = DRAWING_STATES.None;
      }
    },
    canvasMouseOut() {
      this.drawingState.action = DRAWING_STATES.None;
    },
    canvasMouseMove: function(event) {
      // console.log(event);
      if (this.drawingState.action == DRAWING_STATES.Line) {
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

        // this.drawingState.oldPosition = newPosition;
      }
    },
    redraw: function() {
      console.log("Redraw");
      let ctx = this.canvas.getContext("2d");
      ctx.beginPath();
      let strokeNum = 1;
      this.drawingState.existingStrokes.forEach((stroke) => {
        console.log("Stroke #" + strokeNum + ": Positions: " + stroke.positions.length);
        let firstCanvasPosition = this.convertPositionFromRelativeToCanvas(stroke.positions[0]);
        ctx.moveTo(firstCanvasPosition.x, firstCanvasPosition.y);
        stroke.positions.slice(1).forEach((currentRelativePosition) => {
          let currentCanvasPosition = this.convertPositionFromRelativeToCanvas(currentRelativePosition);
          ctx.lineTo(currentCanvasPosition.x, currentCanvasPosition.y);
        })
      })
      ctx.stroke();
      // ctx.beginPath();
      // ctx.moveTo(0, 0);
      // ctx.lineTo(20, 20);
      // ctx.stroke();
      // ctx.closePath();
      console.log("Redraw finished");
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
  },
  mounted() {
    this.canvas = this.$refs.mainCanvas;
    window.addEventListener("resize", this.onResize)
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
    justify-content: center;
    overflow: hidden;
  }

  canvas {
    /*border: solid 1px black;*/
    object-fit: contain;
    background-color: red;
    /*border: solid 2px #dadcda;*/
    display: block;
  }
</style>