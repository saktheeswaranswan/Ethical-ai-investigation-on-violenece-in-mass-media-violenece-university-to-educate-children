let poseData;
let playing = false;
let frameIndex = 0;
let fps = 30;
let totalFrames = 12744; // 424.8 * 30
let canvasWidth = 960;
let canvasHeight = 840;

let scale = 1.0; // you can adjust this
let yOffset = 0;

let skeletonEdges = [
  [5, 7], [7, 9], [6, 8], [8, 10],
  [11, 13], [13, 15], [12, 14], [14, 16],
  [5, 6], [11, 12], [5, 11], [6, 12]
];

function preload() {
  poseData = loadJSON("maahan-maaveerffan-pose.json");
}

function setup() {
  createCanvas(canvasWidth, canvasHeight);
  frameRate(fps);
  textAlign(CENTER, CENTER);
}

function draw() {
  background(0);

  if (!playing) {
    fill(255);
    textSize(24);
    text("Press 'P' to Play Pose", width / 2, height / 2);
    return;
  }

  // Loop playback
  frameIndex = frameCount % totalFrames;

  // Extract pose for this frame
  let persons = [];
  for (let i = 0; i < poseData.length; i++) {
    let entry = poseData[i];
    let fid = entry.frame_id;
    if (fid === frameIndex) {
      persons.push(entry);
    }
  }

  // Draw pose(s)
  for (let person of persons) {
    let keypoints = person.keypoints;
    let scaled = keypoints.map(pt => {
      return [pt[0] * scale, pt[1] * scale + yOffset];
    });

    // Skip if too few points
    let inframe = scaled.filter(pt => pt[0] >= 0 && pt[0] < canvasWidth && pt[1] >= 0 && pt[1] < canvasHeight);
    if (inframe.length < 5) continue;

    // Draw keypoints
    stroke(0, 255, 0);
    fill(0, 255, 0);
    for (let pt of scaled) {
      circle(pt[0], pt[1], 6);
    }

    // Draw skeleton edges
    stroke(255, 0, 0);
    for (let edge of skeletonEdges) {
      let [i, j] = edge;
      if (scaled[i] && scaled[j]) {
        line(scaled[i][0], scaled[i][1], scaled[j][0], scaled[j][1]);
      }
    }
  }

  // Show frame counter
  fill(255);
  noStroke();
  textSize(16);
  text(`Frame: ${frameIndex}`, width - 80, 30);
}

function keyPressed() {
  if (key === 'p' || key === 'P') {
    playing = true;
    frameCount = 0;
  }
}
