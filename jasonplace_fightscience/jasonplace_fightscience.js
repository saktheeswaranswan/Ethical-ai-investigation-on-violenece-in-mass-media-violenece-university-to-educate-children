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

// COCO skeleton edges
const skeletonEdges = [
  [5, 7], [7, 9], [6, 8], [8, 10],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [5, 6], [11, 12], [5, 11], [6, 12]
];

function preload() {
  poseData = loadJSON('rayanpoae.json');
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
  // draw video
  image(video, 0, 0, width, height);

  if (!playing) {
    fill(255);
    textSize(24);
    text("Press 'S' to Start", width / 2, height / 2);
    return;
  }

  // current frame
  let frameIndex = frameCount % totalFrames;
  let persons = poseMap[frameIndex] || [];

  // scale factors
  const origW = canvasWidth, origH = canvasHeight;
  let sx = width / origW;
  let sy = height / origH;

  // draw overlay with translation
  push();
  translate(offsetX, offsetY);

  // draw container around all poses
  let allPts = [];
  for (let p of persons) {
    let pts = p.keypoints.map(pt => [pt[0] * sx, pt[1] * sy]);
    allPts.push(...pts);
  }
  if (allPts.length > 0) {
    let xs = allPts.map(p => p[0]);
    let ys = allPts.map(p => p[1]);
    let minX = min(xs), maxX = max(xs);
    let minY = min(ys), maxY = max(ys);
    noFill();
    stroke(255, 255, 0);
    strokeWeight(4);
    rect(minX - 5, minY - 5, (maxX - minX) + 10, (maxY - minY) + 10);
  }

  // draw each skeleton & joints
  for (let p of persons) {
    let pts = p.keypoints.map(pt => [pt[0] * sx, pt[1] * sy]);
    let valid = pts.filter(pt => pt[0] >= 0 && pt[0] <= width && pt[1] >= 0 && pt[1] <= height);
    if (valid.length < 5) continue;

    // skeleton edges in yellow
    stroke(255, 255, 0);
    strokeWeight(4);
    for (let [i, j] of skeletonEdges) {
      let p1 = pts[i], p2 = pts[j];
      if (p1 && p2) line(p1[0], p1[1], p2[0], p2[1]);
    }

    // joints in red
    noStroke();
    fill(255, 0, 0);
    for (let [x, y] of pts) circle(x, y, 8);
  }
  pop();

  // frame counter
  noStroke(); fill(255);
  textSize(16);
  text(`Frame: ${frameIndex}`, width - 80, 30);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    playing = true;
    frameCount = 0;
    video.loop();
  }
}

function mousePressed() {
  // initiate drag
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
