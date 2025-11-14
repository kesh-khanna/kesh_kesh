let song;
let audioStarted = false;
let peaks;

function preload() {
  song = loadSound("../audio/snow_day.mp3");
}

function setup() {
  let canvas = createCanvas(400, 400);
  canvas.parent('canvas-container'); // Put canvas in the container
  background(220);
  textAlign(CENTER, CENTER);
  textSize(20);
  // text('Click to start audio', width/2, height/2);
  peaks = song.getPeaks(width);
  
  fft = new p5.FFT(0.8, 512);
}

function draw() {
  if (audioStarted) {
    
    let t = map(song.currentTime(), 0, song.duration(), 0, width);
    let t_color = map(song.currentTime(), 0, song.duration(), -255, 255)
    stroke(12, 150, 104);
    line(t, 0, t, height);

    stroke(0)
    for(let i = 0; i < peaks.length; i++){
      line(i, height /2 + peaks[i] * 100, i, height / 2 - peaks[i] * 100);
    }

    let waveform = fft.waveform();

    noFill();
    stroke(0)
    strokeWeight(2);
   

    let sliceWidth = width / waveform.length;
    for (let i = 0; i < waveform.length - 1; i++) {
      let x1 = i * sliceWidth;
      let y1 = map(waveform[i], -1, 1, height * 0.1, height * 0.9);
      let x2 = (i + 1) * sliceWidth;
      let y2 = map(waveform[i + 1], -1, 1, height * 0.1, height * 0.9);
      
      stroke(map(i, 0, waveform.length, 0, 255), map(255 - i, 0, waveform.length, 0, 255), Math.abs(t_color));
      line(x1, y1, x2, y2);
    }
  }
  
}

function mousePressed() {
  // Start audio on first click
  if (!audioStarted) {
    userStartAudio();
    song.loop(); // Use loop() to repeat, or play() for once
    audioStarted = true;
  } else
    // toggle play pause on subsequent clicks
    if (song.isPlaying()) {
      song.pause();
      
    } else {
      song.loop()
    }
}