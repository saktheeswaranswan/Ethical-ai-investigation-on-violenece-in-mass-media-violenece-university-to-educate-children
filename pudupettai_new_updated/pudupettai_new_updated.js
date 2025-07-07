// Improved Full Sketch: Pose Overlay with Accurate Scaling, Glowing Keypoints, and Thick Skeleton Edges

let poseData, poseMap = {}, mainVideo, video2, video3;
let showPose = false, poseTime = 0;
let scaleFactor = 1, offsetX = 0, offsetY = 0;
let isDragging = false, dragStartX, dragStartY;

const fps = 30;
const totalFrames = Math.floor(424.8 * fps);
const skeletonEdges = [
  [5,7],[7,9],[6,8],[8,10],
  [11,13],[13,15],[12,14],[14,16],
  [5,6],[11,12],[5,11],[6,12]
];

// UI elements
let videoControls = [], toggleBtn, pauseBtn, fwdBtn, revBtn, shrinkBtn, enlargeBtn, slider;

function preload() {
  poseData = loadJSON('pudhupettai-sword-fight.json');
  mainVideo = createVideo('videoplaybgfgack.mp4');
  video2 = createVideo('hhh.mp4');
  video3 = createVideo('puutt.mp4');
}

function setup() {
  createCanvas(960, 840);
  frameRate(fps);

  [mainVideo, video2, video3].forEach((v, i) => {
    v.hide();
    v.loop();
    let btn = createButton(`Video ${i+1}: Pause`);
    btn.mousePressed(() => {
      if (v.elt.paused) {
        v.loop();
        btn.html(`Video ${i+1}: Pause`);
      } else {
        v.pause();
        btn.html(`Video ${i+1}: Play`);
      }
    });
    videoControls.push(btn);
  });

  (Array.isArray(poseData) ? poseData : Object.values(poseData)).forEach(e => {
    if (!poseMap[e.frame_id]) poseMap[e.frame_id] = [];
    poseMap[e.frame_id].push(e.keypoints);
  });

  toggleBtn  = createButton('Toggle Pose (T)').mousePressed(() => showPose = !showPose);
  pauseBtn   = createButton('Pause/Play Pose (P)').mousePressed(toggleLoop);
  revBtn     = createButton('<< Reverse 10s (R)').mousePressed(() => seekPose(-10));
  fwdBtn     = createButton('Forward 10s >> (F)').mousePressed(() => seekPose(10));
  shrinkBtn  = createButton('Shrink Overlay (B)').mousePressed(() => scaleFactor = max(0.5, scaleFactor - 0.25));
  enlargeBtn = createButton('Enlarge Overlay (+)').mousePressed(() => scaleFactor = min(3, scaleFactor + 0.25));
  slider     = createSlider(0, mainVideo.duration(), 0, 0.1);
  slider.input(() => poseTime = slider.value());
}

function draw() {
  background(0);

  image(mainVideo, 0, 0, width/2, height);
  image(video2, width/2, 0, width/2, height/2);
  image(video3, width/2, height/2, width/2, height/2);

  if (showPose && mainVideo.elt.readyState >= 2) {
    let frameIdx = floor(poseTime * fps) % totalFrames;
    let persons = poseMap[frameIdx] || [];

    const scaleX = (width / 2) / mainVideo.elt.videoWidth;
    const scaleY = height / mainVideo.elt.videoHeight;

    push();
    translate(offsetX, offsetY);
    scale(scaleFactor);

    blendMode(ADD);
    noStroke();
    fill(255, 0, 0, 255);
    persons.forEach(pts => {
      pts.forEach(p => {
        if (p) {
          const x = p[0] * scaleX;
          const y = p[1] * scaleY;
          circle(x, y, 16);
        }
      });
    });

    blendMode(BLEND);
    strokeWeight(6 / scaleFactor);
    stroke(255, 255, 0);
    persons.forEach(pts => {
      skeletonEdges.forEach(([i, j]) => {
        const p1 = pts[i], p2 = pts[j];
        if (p1 && p2) {
          const x1 = p1[0] * scaleX;
          const y1 = p1[1] * scaleY;
          const x2 = p2[0] * scaleX;
          const y2 = p2[1] * scaleY;
          line(x1, y1, x2, y2);
        }
      });
    });

    pop();

    poseTime += deltaTime / 1000;
    if (poseTime > mainVideo.duration()) poseTime = 0;
    slider.value(poseTime);
  }
}

function toggleLoop() {
  if (isLooping()) noLoop();
  else loop();
}

function isLooping() {
  return frameCount !== 0 && draw === window.draw;
}

function seekPose(dt) {
  poseTime = constrain(poseTime + dt, 0, mainVideo.duration());
  slider.value(poseTime);
}

function keyPressed() {
  const k = key.toUpperCase();
  if (k === 'T') showPose = !showPose;
  else if (k === 'P') toggleLoop();
  else if (k === 'F') seekPose(10);
  else if (k === 'R') seekPose(-10);
  else if (k === 'B') scaleFactor = max(0.5, scaleFactor - 0.00025);
  else if (k === '+') scaleFactor = min(3, scaleFactor + 0.00025);
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
