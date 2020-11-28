<template>
  <div id="app">
    <!-- img alt="Vue logo" src="./assets/logo.png" -->
    <div id="header">
      Header
    </div>
    <DrawingArea id="drawingArea" />
    <div id="footer">
      Footer
    </div>
  </div>
</template>

<script>
import DrawingArea from "@/components/DrawingArea";

export default {
  name: 'App',
  components: {
    DrawingArea,
  }
}
</script>

<style>
html {
  height: 100%;
  margin: 0;
  overflow: auto;
}

body {
  height: 100%;
  margin: 0;
  overflow: auto;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;

  display: flex;
  flex-direction: column;
  height: 100%;
}

#header {
  justify-content: center;
}

#drawingArea {
  flex-direction: row;
  flex-grow: 1;
  flex-basis: auto;
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  margin: auto;
  /*overflow: hidden;*/
}
</style>
