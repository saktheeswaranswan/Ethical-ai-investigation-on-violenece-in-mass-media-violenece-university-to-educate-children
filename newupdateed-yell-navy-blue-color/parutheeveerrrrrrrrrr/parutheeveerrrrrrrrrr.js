// Final Version: 1280x720 Layout, Pose Overlay on Left Video, Side-by-Side Video Setup

let poseData, poseMap = {}, mainVideo, video2, video3;
let poseTime = 0;
let showPose = true;
let scaleCycle = [1, 0.5, 0.25, 20 / 640]; // adjusted for 640px width
let scaleIndex = 0;
let scaleFactor = scaleCycle[scaleIndex];

let offsetX = 0, offsetY = 0;
let isDragging = false, dragStartX, dragStartY;

const fps = 30;
const totalFrames = Math.floor(424.8 * fps);
const skeletonEdges = [
  [5,7],[7,9],[6,8],[8,10],
  [11,13],[13,15],[12,14],[14,16],
  [5,6],[11,12],[5,11],[6,12]
];

let slider;

function preload() {
  poseData = loadJSON('parutheeveeran.json');
  mainVideo = createVideo('lve.mp4');
  video2 = createVideo('partuhee.mp4');
  video3 = createVideo('partuhee.mp4');
}

function setup() {
  createCanvas(1280, 720);
  frameRate(fps);

  [mainVideo, video2, video3].forEach(v => {
    v.hide();
    v.volume(0);
    v.pause();
  });

  (Array.isArray(poseData) ? poseData : Object.values(poseData)).forEach(e => {
    if (!poseMap[e.frame_id]) poseMap[e.frame_id] = [];
    poseMap[e.frame_id].push(e.keypoints);
  });

  // Controls UI
  let yBase = height + 10;

  createButton('Video 1 Play/Pause').position(20, yBase).mousePressed(() => toggleVideo(mainVideo));
  createButton('Video 2 Play/Pause').position(180, yBase).mousePressed(() => toggleVideo(video2));
  createButton('Video 3 Play/Pause').position(340, yBase).mousePressed(() => toggleVideo(video3));

  createButton('Toggle Pose (T)').position(20, yBase + 40).mousePressed(() => showPose = !showPose);
  createButton('<< -10s (R)').position(180, yBase + 40).mousePressed(() => seekPose(-10));
  createButton('+10s >> (F)').position(300, yBase + 40).mousePressed(() => seekPose(10));
  createButton('Shrink Cycle (B)').position(420, yBase + 40).mousePressed(() => {
    scaleIndex = (scaleIndex + 1) % scaleCycle.length;
    scaleFactor = scaleCycle[scaleIndex];
  });

  slider = createSlider(0, mainVideo.duration(), 0, 0.1).position(20, yBase + 80).style('width', '420px');
  slider.input(() => poseTime = slider.value());
}

function draw() {
  background(0);

  // Layout: 640px main video left, 2 stacked 320x360 right
  image(mainVideo, 0, 0, 640, 720);
  image(video2, 640, 0, 640, 360);
  image(video3, 640, 360, 640, 360);

  if (showPose && mainVideo.elt.readyState >= 2) {
    drawPoseOverlay();
    poseTime += deltaTime / 1000;
    if (poseTime > mainVideo.duration()) poseTime = 0;
    slider.value(poseTime);
  }
}

function drawPoseOverlay() {
  let frameIdx = floor(poseTime * fps) % totalFrames;
  let persons = poseMap[frameIdx] || [];

  const scaleX = 640 / mainVideo.elt.videoWidth;
  const scaleY = 720 / mainVideo.elt.videoHeight;

  push();
  translate(offsetX, offsetY);
  scale(scaleFactor);

  // Red glowing keypoints
  blendMode(ADD);
  noStroke();
  fill(255, 0, 0);
  persons.forEach(kpts => {
    kpts.forEach(p => {
      if (p) circle(p[0] * scaleX, p[1] * scaleY, 20);
    });
  });

  // Yellow lean edges
  blendMode(BLEND);
  stroke(255, 255, 0);
  strokeWeight(2 / scaleFactor);
  persons.forEach(kpts => {
    skeletonEdges.forEach(([i, j]) => {
      let a = kpts[i], b = kpts[j];
      if (a && b) {
        line(a[0] * scaleX, a[1] * scaleY, b[0] * scaleX, b[1] * scaleY);
      }
    });
  });

  pop();
}

function toggleVideo(vid) {
  if (vid.elt.paused) vid.loop();
  else vid.pause();
}

function seekPose(dt) {
  poseTime = constrain(poseTime + dt, 0, mainVideo.duration());
  slider.value(poseTime);
}

function keyPressed() {
  const k = key.toUpperCase();
  if (k === 'T') showPose = !showPose;
  else if (k === 'F') seekPose(10);
  else if (k === 'R') seekPose(-10);
  else if (k === 'B') {
    scaleIndex = (scaleIndex + 1) % scaleCycle.length;
    scaleFactor = scaleCycle[scaleIndex];
  }
}

function mousePressed() {
  if (showPose) {
    isDragging = true;
    dragStartX = mouseX - offsetX;
    dragStartY = mouseY - offsetY;
  }
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
