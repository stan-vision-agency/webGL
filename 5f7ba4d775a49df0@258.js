import define1 from "./ab07a49dc1b41864@288.js";

function _1(md){return(
md`# Instanced WebGL Circles

A question came up of how to draw lots of circles efficiently. The most efficient method I know of uses WebGL with the [\`ANGLE_instanced_arrays\`](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays) extension to place and scale many identical circle instances.

It seemed like a fun exercise and a good way to incrementally iterate on my Observable skills, so here we are. I'm going to use the [regl](https://github.com/regl-project/regl) WebGL wrapper because it adds tons of convenience with very few of its own abstractions. Still, this method should generalize to WebGL and most other WebGL libraries without too much translation.`
)}

function _2(md){return(
md`First, we create and view a regl context. We configure a couple options while setting it up:

- Disable antialiasing. Very expensive; not that helpful here.
- Use the [\`ANGLE_instanced_arrays\`](https://developer.mozilla.org/en-US/docs/Web/API/ANGLE_instanced_arrays) extension to draw lots of circles with a single WebGL draw call.`
)}

function _regl(reglCanvas,width){return(
reglCanvas(this, {
  width,
  height: Math.max(600, width * 0.6),
  extensions: ["ANGLE_instanced_arrays"],
  attributes: { antialias: false, depth: false }
})
)}

function _numCircleInstances(Inputs){return(
Inputs.range([20, 4000], {
  value: 4000,
  transform: Math.log,
  step: 1,
  label: "circle instance count"
})
)}

function _numCircleDivisions(Inputs){return(
Inputs.range([3, 200], {
  value: 200,
  step: 1,
  transform: Math.log,
  label: "vertices per circle"
})
)}

function _7(md,numCircleInstances,numCircleDivisions){return(
md`Below is our main iteration loop. We simply clear the screen and execute a single draw command to draw ${numCircleInstances} circles each with ${numCircleDivisions} divisions, totaling ${numCircleInstances * (numCircleDivisions + 1)} vertices.`
)}

function* _loop(regl,draw)
{
  while (true) {
    regl.poll();
    regl.clear({ color: [0.05, 0.05, 0.05, 0] });
    draw();
    yield;
  }
}


function _9(md,tex){return(
md`We now define what a single circle looks like. We can get away with a regular JavaScript \`Array\` of ${tex`(x, y)`} pairs. [\`regl\` is smart enough](https://github.com/regl-project/regl/blob/master/API.md#buffers) to do some basic flattening into a typed array so that we don't have to.`
)}

function _circleInstanceGeometry(numCircleDivisions){return(
Array.from(Array(numCircleDivisions + 1).keys()).map(i => {
  var theta = Math.PI * 2 * i / numCircleDivisions;
  return [Math.cos(theta), Math.sin(theta)];
})
)}

function _11(md,tex){return(
md`Next, we define a list of ${tex`\theta`} values we'll use in the vertex shader to place each instance.`
)}

function _instanceTheta(numCircleInstances){return(
Array.from(Array(numCircleInstances).keys()).map(i => 
  i / numCircleInstances * 2 * Math.PI
)
)}

function _13(md){return(
md`Finally we define the actual draw command. One subtle thing to note here is that due to Observable data flow, this command is recreated each time the parameters above are changed. The proper way to avoid this would be to create buffers (\`circleInstanceGeometryBuffer = regl.buffer(circleInstanceGeometry)\` and the same for \`instanceTheta\`), then pass the buffers as a regl property to the draw command *when the command is invoked*.

This small change would decouple the command definition from the variables above so that Observable would not recreate the command. That said, I've not done this here for two reasons. The addition adds some complexity to the code, and recreating commands many times doesn't seem to cause problems—though I suspect there probably is an upper limit to how many commands you can allocate before things just stop working.`
)}

function _draw(regl,circleInstanceGeometry,instanceTheta,numCircleInstances,numCircleDivisions){return(
regl({
  vert: `
    precision highp float;
    attribute float theta;
    attribute vec2 circlePoint;
    varying vec3 vColor;
    uniform vec2 aspectRatio;
    uniform float time;
    const float PI = 3.1415926535;
    void main () {
      // Use lots of sines and cosines to place the circles
      vec2 circleCenter = vec2(cos(theta), sin(theta))
        * (0.6 + 0.2 * cos(theta * 6.0 + cos(theta * 8.0 + time)));

      // Modulate the circle sizes around the circle and in time
      float circleSize = 0.2 + 0.12 * cos(theta * 9.0 - time * 2.0);

      vec2 xy = circleCenter + circlePoint * circleSize;

      // Define some pretty colors
      float th = 8.0 * theta + time * 2.0;
      vColor = 0.6 + 0.4 * vec3(
        cos(th),
        cos(th - PI / 3.0),
        cos(th - PI * 2.0 / 3.0)
      );

      gl_Position = vec4(xy / aspectRatio, 0, 1);
    }`,
  frag: `
    precision highp float;
    varying vec3 vColor;
    uniform float alpha;
    void main () {
      gl_FragColor = vec4(vColor, alpha);
    }`,
  attributes: {
    // This attribute defines what we draw; we fundamentally draw circle vertices
    circlePoint: circleInstanceGeometry,
    
    // This attribute allows us to compute where we draw each circle. the divisor
    // means we step through one value *per circle*.
    theta: {buffer: instanceTheta, divisor: 1},
  },
  uniforms: {
    // Scale so that it fits in the view whether it's portrait or landscape:
    aspectRatio: ctx => ctx.framebufferWidth > ctx.framebufferHeight ?
      [ctx.framebufferWidth / ctx.framebufferHeight, 1] :
      [1, ctx.framebufferHeight / ctx.framebufferWidth],
    
    time: regl.context('time'),
    
    // Decrease opacity when there are more circles
    alpha: Math.max(0, Math.min(1, 0.15 * 2000 / numCircleInstances)),
  },
  blend: {
    // Additive blending
    enable: true,
    func: {srcRGB: 'src alpha', srcAlpha: 1, dstRGB: 1, dstAlpha: 1},  
    equation: {rgb: 'add', alpha: 'add'}
  },
  // GL_LINES are in general *pretty bad*, but they're good for some things
  primitive: 'line strip',
  depth: {enable: false},
  count: numCircleDivisions + 1,
  instances: numCircleInstances,
})
)}

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], _1);
  main.variable(observer()).define(["md"], _2);
  main.variable(observer("viewof regl")).define("viewof regl", ["reglCanvas","width"], _regl);
  main.variable(observer("regl")).define("regl", ["Generators", "viewof regl"], (G, _) => G.input(_));
  const child1 = runtime.module(define1);
  main.import("reglCanvas", child1);
  main.variable(observer("viewof numCircleInstances")).define("viewof numCircleInstances", ["Inputs"], _numCircleInstances);
  main.variable(observer("numCircleInstances")).define("numCircleInstances", ["Generators", "viewof numCircleInstances"], (G, _) => G.input(_));
  main.variable(observer("viewof numCircleDivisions")).define("viewof numCircleDivisions", ["Inputs"], _numCircleDivisions);
  main.variable(observer("numCircleDivisions")).define("numCircleDivisions", ["Generators", "viewof numCircleDivisions"], (G, _) => G.input(_));
  main.variable(observer()).define(["md","numCircleInstances","numCircleDivisions"], _7);
  main.variable(observer("loop")).define("loop", ["regl","draw"], _loop);
  main.variable(observer()).define(["md","tex"], _9);
  main.variable(observer("circleInstanceGeometry")).define("circleInstanceGeometry", ["numCircleDivisions"], _circleInstanceGeometry);
  main.variable(observer()).define(["md","tex"], _11);
  main.variable(observer("instanceTheta")).define("instanceTheta", ["numCircleInstances"], _instanceTheta);
  main.variable(observer()).define(["md"], _13);
  main.variable(observer("draw")).define("draw", ["regl","circleInstanceGeometry","instanceTheta","numCircleInstances","numCircleDivisions"], _draw);
  return main;
}
