// sketch.js — scalable, movable pose overlay

let poseData;
let poseMap = {};
let video;
let playing = false;
let playFrame = 0;

const fps = 30;
const totalFrames = Math.floor(424.8 * fps);
const canvasWidth = 960;
const canvasHeight = 840;

// translation and scaling
let offsetX = 0;
let offsetY = 0;
let scaleFactor = 1.0;
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
  poseData = loadJSON('kannodo-kannodu.json');
  video = createVideo('inidiantwo.mp4');
}

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  frameRate(fps);
  video.hide();

  // build lookup by frame
  let entries = Array.isArray(poseData) ? poseData : Object.values(poseData);
  for (let e of entries) {
    let fid = e.frame_id;
    if (!poseMap[fid]) poseMap[fid] = [];
    poseMap[fid].push(e.keypoints);
  }
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);

  if (!playing) {
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Press 'S' to Start", width / 2, height / 2);
    return;
  }

  // advance frame counter
  playFrame = (playFrame + 1) % totalFrames;
  let frameIndex = playFrame;

  let persons = poseMap[frameIndex] || [];

  // determine scale to fit original
  let sx = (width / canvasWidth) * scaleFactor;
  let sy = (height / canvasHeight) * scaleFactor;

  // apply translation and global scale
  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  strokeWeight(3 / scaleFactor);

  for (let pts of persons) {
    // draw edges
    stroke(255, 255, 0);
    for (let [i, j] of skeletonEdges) {
      let p1 = pts[i];
      let p2 = pts[j];
      if (p1 && p2) {
        let x1 = p1[0] * (width / canvasWidth);
        let y1 = p1[1] * (height / canvasHeight);
        let x2 = p2[0] * (width / canvasWidth);
        let y2 = p2[1] * (height / canvasHeight);
        line(x1, y1, x2, y2);
      }
    }
    // draw joints
    noStroke();
    fill(255, 0, 0);
    for (let p of pts) {
      if (p) {
        let x = p[0] * (width / canvasWidth);
        let y = p[1] * (height / canvasHeight);
        circle(x, y, 6 / scaleFactor);
      }
    }
  }

  pop();

  // display frame number
  noStroke();
  fill(255);
  textSize(16);
  text(`Frame: ${frameIndex}`, width - 80, 30);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    playing = true;
    playFrame = 0;
    video.loop();
  } else if (key === 'b' || key === 'B') {
    // cycle scale between 0.5x, 1x, 1.5x, 2x
    scaleFactor += 0.5;
    if (scaleFactor > 2) scaleFactor = 0.5;
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
