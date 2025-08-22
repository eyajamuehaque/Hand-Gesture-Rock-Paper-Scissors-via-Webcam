import { FilesetResolver, HandLandmarker, DrawingUtils } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const signEl = document.getElementById("sign");
const computerEl = document.getElementById("computer-choice");
const resultEl = document.getElementById("result");
const gamePanel = document.querySelector(".game");
const drawingUtils = new DrawingUtils(ctx);

let handLandmarker;
let lastUserChoice = null;
let lastComputerChoice = null;
let lastResult = null;

async function init() {
  const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm");
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task" },
    runningMode: "VIDEO",
    numHands: 1,
  });
  startCamera();
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  video.onloadedmetadata = () => {
    video.play();
    detectHands();
  };
}

async function detectHands() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const results = await handLandmarker.detectForVideo(video, performance.now());

  if (results.landmarks && results.landmarks.length > 0) {
    const landmarks = results.landmarks[0];


    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, { color: "#222", lineWidth: 2 });
      const time = performance.now() / 300;
      const fingerColors = ["#ff0000","#00ff00","#ffff00","#ff0000","#00ff00"];
      for (let i = 0; i < landmarks.length; i++) {
        const pulseRadius = 5 + Math.sin(time + i) * 1.5;
        drawingUtils.drawLandmarks([landmarks[i]], { color: fingerColors[i % fingerColors.length], radius: pulseRadius });
      }
    }

    const userRPS = getRPS(landmarks);
    signEl.textContent = `You: ${userRPS}`;
    signEl.classList.add("show");

    playRPS(userRPS); 

  } else {
    signEl.textContent = "No hand detected";
    signEl.classList.remove("show");

    lastComputerChoice = null;
    lastResult = null;
    computerEl.textContent = "Computer: ";
    resultEl.textContent = "";
    handPresent = false;
  }

  requestAnimationFrame(detectHands);
}


function getRPS(landmarks) {
  const tips = [8,12,16,20];
  let fingersUp = 0;
  for (let tip of tips) {
    const base = tip - 2;
    if (landmarks[tip].y + 0.02 < landmarks[base].y) fingersUp++;
  }
  if(fingersUp === 0) return "Rock";
  if(fingersUp >= 4) return "Paper";
  if(fingersUp === 2) return "Scissors";
  return "Unknown";
}

let handPresent = false;

function playRPS(userChoice) {
  const options = ["Rock", "Paper", "Scissors"];

  if (userChoice === "Unknown") {
    lastComputerChoice = null;
    lastResult = "";
    computerEl.textContent = "Computer: ";
    resultEl.textContent = "";
    handPresent = false;
  } else {
    if (!handPresent || userChoice !== lastUserChoice) {
      lastComputerChoice = options[Math.floor(Math.random() * 3)];

      if (userChoice === lastComputerChoice) {
        lastResult = "Draw";
        resultEl.style.color = "yellow";
      } else if (
        (userChoice === "Rock" && lastComputerChoice === "Scissors") ||
        (userChoice === "Paper" && lastComputerChoice === "Rock") ||
        (userChoice === "Scissors" && lastComputerChoice === "Paper")
      ) {
        lastResult = "Win";
        resultEl.style.color = "green";
      } else {
        lastResult = "Lose";
        resultEl.style.color = "red";
      }
    }

   
    computerEl.textContent = `Computer: ${lastComputerChoice}`;
    resultEl.textContent = lastResult;

    computerEl.classList.remove("show");
    resultEl.classList.remove("show");
    void computerEl.offsetWidth;
    void resultEl.offsetWidth;
    computerEl.classList.add("show");
    resultEl.classList.add("show");

    gamePanel.classList.remove("active");
    void gamePanel.offsetWidth;
    gamePanel.classList.add("active");

    handPresent = true;
  }

  lastUserChoice = userChoice;
}


init();
