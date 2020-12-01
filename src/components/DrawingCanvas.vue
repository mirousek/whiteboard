<template>
  <canvas
      ref="canvas"
      :style="{ width: width+2 + 'px', height: height + 'px'}"
      :width="width"
      :height="height"
      v-on:mousedown.stop.prevent="canvasMouseDown"
      v-on:mousemove.stop.prevent="canvasMouseMove"
      v-on:mouseup.stop.prevent="canvasMouseUp"
  />
</template>

<script>
import {DRAWING_STATES} from "../modules/Constants"
import {Position} from "@/modules/Classes";

export default {
  name: "DrawingCanvas",
  props: [
      'width',
      'height'
  ],
  data: () => {
    return {
      canvas: null,
    }
  },
  methods: {
    canvasMouseDown(e) {
      let mouseCanvasPosition = this.getMouseCanvasPosition(e);
      e.drawingCanvas = {
        mouseCanvasPosition: mouseCanvasPosition,
        mouseRelativePosition: this.convertPositionFromCanvasToRelative(mouseCanvasPosition),
      };

      this.$emit('mousedown', e)
    },
    canvasMouseUp(e) {
      let mouseCanvasPosition = this.getMouseCanvasPosition(e);
      e.drawingCanvas = {
        mouseCanvasPosition: mouseCanvasPosition,
        mouseRelativePosition: this.convertPositionFromCanvasToRelative(mouseCanvasPosition),
      };

      this.$emit('mouseup', e)
    },
    canvasMouseMove(e) {
      let mouseCanvasPosition = this.getMouseCanvasPosition(e);
      e.drawingCanvas = {
        mouseCanvasPosition: mouseCanvasPosition,
        mouseRelativePosition: this.convertPositionFromCanvasToRelative(mouseCanvasPosition),
      };

      this.$emit('mousemove', e)
    },
    getMouseCanvasPosition: function(event) {
      return new Position (event.clientX - this.canvas.offsetLeft, event.clientY - this.canvas.offsetTop);
    },
    convertPositionFromCanvasToRelative(canvasPosition) {
      let xRel = canvasPosition.x / this.width;
      let yRel = canvasPosition.y / this.height;

      return new Position(xRel, yRel);
    },
    convertPositionFromRelativeToCanvas(relativePosition) {
      let xCan = relativePosition.x * this.width;
      let yCan = relativePosition.y * this.height;

      return new Position(xCan, yCan);
    },
    redraw: function(strokes) {
      let ctx = this.canvas.getContext("2d");
      ctx.clearRect(0, 0, this.width, this.height);

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

  },
  mounted() {
    this.canvas = this.$refs.canvas;
  }
}
</script>

<style scoped>

</style>