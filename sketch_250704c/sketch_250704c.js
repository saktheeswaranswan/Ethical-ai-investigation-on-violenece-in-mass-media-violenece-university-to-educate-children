// sketch.js

let poseData;
let poseMap = {};
let video;
let playing = false;

const fps = 30;
const totalFrames = 424.8 * fps;  // 424.8 seconds × 30 fps = 12744
const canvasWidth = 960;
const canvasHeight = 840;

// translation offsets for moving the overlay
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

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
  poseData = loadJSON('bruce.json');
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

  // current frame index
  let frameIndex = frameCount % totalFrames;
  let persons = poseMap[frameIndex] || [];

  // scale factors
  const origW = canvasWidth, origH = canvasHeight;
  let sx = width / origW;
  let sy = height / origH;

  // collect all keypoints in the frame
  let allPts = [];
  for (let p of persons) {
    let pts = p.keypoints.map(pt => [pt[0] * sx, pt[1] * sy]);
    allPts.push(...pts);
  }

  // create fixed bounding box if not already made
  if (!fixedBox && allPts.length > 0) {
    let xs = allPts.map(p => p[0]);
    let ys = allPts.map(p => p[1]);
    let minX = min(xs), maxX = max(xs);
    let minY = min(ys), maxY = max(ys);
    fixedBox = {
      x: minX - boxPadding,
      y: minY - boxPadding,
      w: (maxX - minX) + 2 * boxPadding,
      h: (maxY - minY) + 2 * boxPadding
    };
  }

  // draw overlay with translation
  push();
  translate(offsetX, offsetY);

  // draw fixed bounding box
  if (fixedBox) {
    noFill();
    stroke(0, 255, 255);
    strokeWeight(4);
    rect(fixedBox.x, fixedBox.y, fixedBox.w * boxScale, fixedBox.h * boxScale);
  }

  // draw skeletons
  for (let p of persons) {
    let pts = p.keypoints.map(pt => [pt[0] * sx, pt[1] * sy]);
    let valid = pts.filter(pt => pt[0] >= 0 && pt[0] <= width && pt[1] >= 0 && pt[1] <= height);
    if (valid.length < 5) continue;

    // draw edges
    stroke(255, 255, 0);
    strokeWeight(4);
    for (let [i, j] of skeletonEdges) {
      let p1 = pts[i], p2 = pts[j];
      if (p1 && p2) line(p1[0], p1[1], p2[0], p2[1]);
    }

    // draw joints
    noStroke();
    fill(255, 0, 0);
    for (let [x, y] of pts) circle(x, y, 8);
  }

  pop();

  // show frame number
  noStroke(); fill(255);
  textSize(16);
  text(`Frame: ${frameIndex}`, width - 80, 30);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    playing = true;
    frameCount = 0;
    video.loop();
  } else if (key === 'b' || key === 'B') {
    // enlarge bounding box scale
    boxScale += 0.1;
    if (boxScale > 2.0) boxScale = 0.5; // cycle back
  }
}

function mousePressed() {
  isDragging = true;
  dragStartX = mouseX - offsetX;
  dragStartY = mouseY - offsetY;
}

function mouseDragged() {
  if (isDragging) {
    offsetX = mouseX - dragStartX;
    offsetY = mouseY - dragStartY;
  }
}

function mouseReleased() {
  isDragging = false;
}
