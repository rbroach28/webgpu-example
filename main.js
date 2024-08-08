const canvas = document.querySelector("canvas");

// First check if WebGPU is supported
if (!navigator.gpu) throw new Error("WebGPU not supported on this browser");

// Initialize WebGPU by requesting the GPUAdapter: https://gpuweb.github.io/gpuweb/#gpuadapter
// Here we're letting the browser pick the default adapter
// But you can pass arguments to the requestAdapter to specify what you want to use
const adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw new Error("No GPUAdapter found");

// Init the GPUDevice: https://gpuweb.github.io/gpuweb/#gpudevice
// This is the main interface for using WebGPU features
const device = await adapter.requestDevice();

// Configure the canvas to work with WebGPU
const context = canvas.getContext("webgpu");
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
context.configure({
  device,
  format: canvasFormat,
});

// This would be the four points of a square
let vertices = new Float32Array([-0.8, -0.8, 0.8, -0.8, 0.8, 0.8, -0.8, 0.8]);

// The GPU needs triangles, though. So we convert that into triangles
vertices = new Float32Array([
  -0.8,
  -0.8,
  0.8,
  -0.8,
  0.8,
  0.8 - // these 3 pairs are the points of one triangle of the square
    0.8,
  -0.8,
  0.8,
  0.8,
  -0.8,
  0.8,
]);

const vertexBuffer = device.createBuffer({
  label: "Cell vertices",
  size: vertices.byteLength,
  usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});

device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/ 0, vertices);

const vertexBufferLayout = {
  arrayStride: 8,
  attributes: [
    {
      format: "float32x2",
      offset: 0,
      shaderLocation: 0, // Position, see vertex shader
    },
  ],
};

// Create Command Encoder to send commands to the GPU: https://gpuweb.github.io/gpuweb/#gpucommandencoder
const encoder = device.createCommandEncoder();

// Init the render pass
// getCurrentTexture() returns a texture with a pixel width and height matching
// the canvas's width and height attributes and the format specified when you called context.configure().
const pass = encoder
  .beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        storeOp: "store",
        clearValue: { r: 0, g: 0, b: 0.4, a: 1 }, // Can also pass an array like this [0, 0, 0.4, 1]
      },
    ],
  })
  .end();

// Creates a
const commandBuffer = encoder.finish();
device.queue.submit([commandBuffer]);
// device.queue.submit([encoder.finish()]); This is an alternate and common way to see the two lines above collapsed into one.
