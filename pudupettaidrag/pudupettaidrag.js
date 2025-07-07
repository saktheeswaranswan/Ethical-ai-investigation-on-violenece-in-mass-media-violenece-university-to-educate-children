// sketch.js — 3 videos with pose overlay on main video

let poseData;
let poseMap = {};
let mainVideo, video2, video3;
let playing = false;

const fps = 30;
const canvasWidth = 960;
const canvasHeight = 840;

// translation & scale for pose
let offsetX = 0;
let offsetY = 0;
let scaleFactor = 1.0;

// pose dragging
let isDraggingPose = false;
let dragStartX = 0;
let dragStartY = 0;

// dragging videos
let isDraggingVideo = false;
let draggingVideoId = null;
let videoOffsets = {
  main: { x: 0, y: 0, w: canvasWidth / 2, h: canvasHeight },
  v2: { x: canvasWidth / 2, y: 0, w: canvasWidth / 2, h: canvasHeight / 2 },
  v3: { x: canvasWidth / 2, y: canvasHeight / 2, w: canvasWidth / 2, h: canvasHeight / 2 },
};
let dragVideoStart = { x: 0, y: 0 };

const skeletonEdges = [
  [5, 7], [7, 9], [6, 8], [8, 10],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [5, 6], [11, 12], [5, 11], [6, 12]
];

let maxPoseFrame = 0;

function preload() {
  poseData = loadJSON('pudhupettai-sword-fight.json');
  mainVideo = createVideo('videoplaybgfgack.mp4');
  video2 = createVideo('hhh.mp4');
  video3 = createVideo('puutt.mp4');
}

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  frameRate(fps);

  mainVideo.hide();
  video2.hide();
  video3.hide();

  const entries = Array.isArray(poseData) ? poseData : Object.values(poseData);
  for (let entry of entries) {
    const fid = entry.frame_id;
    if (!poseMap[fid]) poseMap[fid] = [];
    poseMap[fid].push(entry.keypoints);
  }

  maxPoseFrame = Math.max(...Object.keys(poseMap).map(f => parseInt(f)));
}

function draw() {
  background(0);

  // Draw all videos using current offsets
  image(mainVideo, videoOffsets.main.x, videoOffsets.main.y, videoOffsets.main.w, videoOffsets.main.h);
  image(video2, videoOffsets.v2.x, videoOffsets.v2.y, videoOffsets.v2.w, videoOffsets.v2.h);
  image(video3, videoOffsets.v3.x, videoOffsets.v3.y, videoOffsets.v3.w, videoOffsets.v3.h);

  if (!playing) {
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Press 'S' to Start", width / 2, height / 2);
    return;
  }

  // Get current video frame
  const currentTime = mainVideo.time();
  let frameIndex = Math.floor(currentTime * fps);
  frameIndex = frameIndex % (maxPoseFrame + 1);
  const persons = poseMap[frameIndex] || [];

  // Pose overlay (only on main video)
  push();
  translate(videoOffsets.main.x + offsetX, videoOffsets.main.y + offsetY);
  scale(scaleFactor);
  strokeWeight(3 / scaleFactor);

  for (let pts of persons) {
    stroke(255, 255, 0);
    for (let [i, j] of skeletonEdges) {
      const p1 = pts[i];
      const p2 = pts[j];
      if (p1 && p2) {
        const x1 = p1[0] * (videoOffsets.main.w / canvasWidth);
        const y1 = p1[1] * (videoOffsets.main.h / canvasHeight);
        const x2 = p2[0] * (videoOffsets.main.w / canvasWidth);
        const y2 = p2[1] * (videoOffsets.main.h / canvasHeight);
        line(x1, y1, x2, y2);
      }
    }

    noStroke();
    fill(255, 0, 0);
    for (let p of pts) {
      if (p) {
        const x = p[0] * (videoOffsets.main.w / canvasWidth);
        const y = p[1] * (videoOffsets.main.h / canvasHeight);
        circle(x, y, 6 / scaleFactor);
      }
    }
  }

  pop();

  // Frame info
  fill(255);
  textSize(16);
  text(`Pose Frame: ${frameIndex}`, width - 150, 30);
}

function keyPressed() {
  if (key === 's' || key === 'S') {
    playing = true;
    mainVideo.time(0);
    video2.time(0);
    video3.time(0);
    mainVideo.loop();
    video2.loop();
    video3.loop();
  } else if (key === 'b' || key === 'B') {
    scaleFactor += 0.5;
    if (scaleFactor > 2.0) scaleFactor = 0.5;
  }
}

function mousePressed() {
  // Check if clicking inside a video to drag
  for (const [id, v] of Object.entries(videoOffsets)) {
    if (
      mouseX >= v.x && mouseX <= v.x + v.w &&
      mouseY >= v.y && mouseY <= v.y + v.h
    ) {
      isDraggingVideo = true;
      draggingVideoId = id;
      dragVideoStart.x = mouseX - v.x;
      dragVideoStart.y = mouseY - v.y;
      return;
    }
  }

  // Otherwise, pose overlay dragging
  isDraggingPose = true;
  dragStartX = mouseX - offsetX;
  dragStartY = mouseY - offsetY;
}

function mouseDragged() {
  if (isDraggingVideo && draggingVideoId) {
    videoOffsets[draggingVideoId].x = mouseX - dragVideoStart.x;
    videoOffsets[draggingVideoId].y = mouseY - dragVideoStart.y;
  } else if (isDraggingPose) {
    offsetX = mouseX - dragStartX;
    offsetY = mouseY - dragStartY;
  }
}

function mouseReleased() {
  isDraggingVideo = false;
  isDraggingPose = false;
  draggingVideoId = null;
}
