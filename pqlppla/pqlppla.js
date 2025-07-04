// sketch.js

let poseData;
let poseMap = {};
let video;
let playing = false;

const fps = 30;
const totalFrames = 424.8 * fps;  // 424.8 seconds × 30 fps = 12744
const canvasWidth = 960;
const canvasHeight = 840;

// translation offsets for moving the overlay globally
let offsetX = 0;
let offsetY = 0;

// individual pose offsets and lock state: {frameId: {poseIndex: {dx, dy, locked}}}
let poseState = {};

// selection state
let selectMode = false;
let selected = null; // {frameId, poseIndex}

// fixed bounding box and scale
let fixedBox = null;
let boxPadding = 10;
let boxScale = 1.0;

// COCO skeleton edges
const skeletonEdges = [
  [5, 7], [7, 9], [6, 8], [8, 10],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [5, 6], [11, 12], [5, 11], [6, 12]
];

function preload() {
  poseData = loadJSON('maahan.json');
  video = createVideo('inidiantwo.mp4');
}

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  frameRate(fps);
  video.hide();
  textAlign(CENTER, CENTER);

  // Build frame lookup
  let arr = Array.isArray(poseData) ? poseData : Object.values(poseData);
  for (let entry of arr) {
    let fid = entry.frame_id;
    poseMap[fid] = poseMap[fid] || [];
    poseMap[fid].push(entry);
  }
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);

  if (!playing) {
    fill(255);
    textSize(24);
    text("Press 'S' to Start", width / 2, height / 2);
    return;
  }

  let frameIndex = frameCount % totalFrames;
  let persons = poseMap[frameIndex] || [];

  const sx = width / canvasWidth;
  const sy = height / canvasHeight;

  // draw overlay
  push();
  translate(offsetX, offsetY);

  // draw skeletons with individual states
  for (let i = 0; i < persons.length; i++) {
    let p = persons[i];
    let pts = p.keypoints.map(pt => [pt[0] * sx, pt[1] * sy]);
    let valid = pts.filter(pt => pt[0] >= 0 && pt[0] <= width && pt[1] >= 0 && pt[1] <= height);
    if (valid.length < 5) continue;

    // ensure state exists
    poseState[frameIndex] = poseState[frameIndex] || {};
    let state = poseState[frameIndex][i] || {dx: 0, dy: 0, locked: false};
    poseState[frameIndex][i] = state;

    // apply individual offset
    push();
    translate(state.dx, state.dy);

    // draw edges
    stroke(255, 255, 0);
    strokeWeight(4);
    for (let [a, b] of skeletonEdges) {
      let [x1, y1] = pts[a];
      let [x2, y2] = pts[b];
      line(x1, y1, x2, y2);
    }

    // draw joints
    noStroke();
    fill(255, 0, 0);
    for (let [x, y] of pts) circle(x, y, 8);
    pop();

    // highlight selected
    if (selected && selected.frameId === frameIndex && selected.poseIndex === i) {
      noFill();
      stroke(0, 255, 255);
      strokeWeight(3);
      let [cx, cy] = centroid(pts);
      ellipse(cx + state.dx, cy + state.dy, 80);
    }
  }

  pop();

  // draw frame info
  noStroke(); fill(255);
  textSize(16);
  text(`Frame: ${frameIndex}`, width - 80, 30);

  if (selectMode) {
    fill(255, 255, 0);
    textSize(16);
    text("Select mode (Q): Click to pick skeleton", width / 2, 30);
  }
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    playing = true;
    frameCount = 0;
    video.loop();
  } else if (key === 'q' || key === 'Q') {
    selectMode = true;
  } else if (key === 'p' || key === 'P') {
    // place: exit select/drag
    selected = null;
    selectMode = false;
  } else if (key === 'l' || key === 'L') {
    // lock if a pose is selected
    if (selected) {
      let state = poseState[selected.frameId][selected.poseIndex];
      state.locked = true;
    }
    selected = null;
    selectMode = false;
  } else if (key === 'b' || key === 'B') {
    boxScale += 0.1;
    if (boxScale > 2.0) boxScale = 0.5;
  }
}

function mousePressed() {
  if (selectMode) {
    let frameIndex = frameCount % totalFrames;
    let persons = poseMap[frameIndex] || [];
    const sx = width / canvasWidth;
    const sy = height / canvasHeight;
    // find closest skeleton centroid
    let best = null;
    for (let i = 0; i < persons.length; i++) {
      let pts = persons[i].keypoints.map(pt => [pt[0] * sx, pt[1] * sy]);
      let [cx, cy] = centroid(pts);
      let d = dist(mouseX - offsetX, mouseY - offsetY, cx, cy);
      if (!best || d < best.d) best = {frameIndex, i, d};
    }
    if (best && best.d < 50) {
      selected = {frameId: best.frameIndex, poseIndex: best.i};
    }
  }
}

function mouseDragged() {
  if (selected) {
    let state = poseState[selected.frameId][selected.poseIndex];
    if (!state.locked) {
      state.dx += (mouseX - pmouseX);
      state.dy += (mouseY - pmouseY);
    }
  }
}

function centroid(points) {
  let x = 0, y = 0;
  points.forEach(p => { x += p[0]; y += p[1]; });
  return [x / points.length, y / points.length];
}
