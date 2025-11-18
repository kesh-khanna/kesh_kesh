let song;
let audioStarted = false;
let peaks;
let slider;
let fft;
let playPauseButton;
let amplitude;

function preload() {
  song = loadSound("../audio/snow_day.mp3");
}

function setup() {
  let container = select('#canvas-container');
  let canvas = createCanvas(container.width, 400);
  canvas.parent('canvas-container');
  background(220, 5);
  textAlign(CENTER, CENTER);
  textSize(20);
  
  // Create slider below canvas
  slider = createSlider(0, 100, 0, 0.1);
  slider.parent('canvas-container');
  slider.style('width', '100%');
  slider.style('display', 'block');
  slider.style('margin-top', '10px');
  slider.input(skipToPosition);
  
  // Create play/pause button below slider
  playPauseButton = createButton('play :0');
  playPauseButton.parent('canvas-container');
  playPauseButton.style('display', 'block');
  playPauseButton.style('margin-top', '10px');
  playPauseButton.style('padding', '10px 20px');
  playPauseButton.style('font-size', '16px');
  playPauseButton.style('cursor', 'pointer');
  playPauseButton.style('border-radius', '5px');
  playPauseButton.mousePressed(togglePlayPause);
  
  peaks = song.getPeaks(width);
  fft = new p5.FFT(0.8, 512);
  amplitude = new p5.Amplitude();
}

function draw() {
  if (audioStarted) {
    background(220, 10);
    if (!slider.elt.matches(':active')) {
      let progress = (song.currentTime() / song.duration()) * 100;
      slider.value(progress);
    }
    
    let t = map(song.currentTime(), 0, song.duration(), 0, width);
    let t_color = map(song.currentTime(), 0, song.duration(), -255, 255);
    let t_color_short = map(song.currentTime(), 0, song.duration(), 0, 255);
    let t_color_abs = Math.abs(t_color);
    
    // Get current amplitude level (0.0 to 1.0)
    let level = amplitude.getLevel();
    // Map amplitude to scale factor
    let pulseScale = map(level, 0, 1, 50, 300);
    
    let waveform = fft.waveform();
    
    // Calculate which waveform index the progress line is at
    let sliceWidth = width / waveform.length;
    let progressIndex = floor(t / sliceWidth);
    progressIndex = constrain(progressIndex, 0, waveform.length - 1);
    
    // Get the original waveform color at progress line
    let waveR = map(progressIndex, 0, waveform.length, 0, 255);
    let waveG = map(255 - progressIndex, 0, waveform.length, 0, 255);
    let waveB = t_color_short;
    
    // Convert RGB to HSB to get complementary color
    colorMode(HSB, 360, 100, 100);
    let c = color(waveR, waveG, waveB);
    let h = hue(c);
    let s = saturation(c);
    let b = brightness(c);
    
    // Complementary color is 180 degrees opposite on color wheel
    let compH = (h + 180) % 360;
    
    // Get complementary color in RGB
    let compColor = color(compH, s, b);
    colorMode(RGB, 255);
    let peakR = red(compColor);
    let peakG = green(compColor);
    let peakB = blue(compColor);
    
    // Draw progress line
    stroke(t_color_abs, t_color_abs, t_color_abs);
    line(t, 0, t, height);
    
    // Draw peaks with complementary color
    stroke(peakR, peakG, peakB);
    for(let i = 0; i < peaks.length; i++){
      line(i, height /2 + peaks[i] * pulseScale, i, height / 2 - peaks[i] * pulseScale);
    }
    
    // Draw waveform
    noFill();
    strokeWeight(2);
   
    for (let i = 0; i < waveform.length - 1; i++) {
      let x1 = i * sliceWidth;
      let y1 = map(waveform[i], -1, 1, height * 0.1, height * 0.9);
      let x2 = (i + 1) * sliceWidth;
      let y2 = map(waveform[i + 1], -1, 1, height * 0.1, height * 0.9);
      
      stroke(map(i, 0, waveform.length, 0, 255), map(255 - i, 0, waveform.length, 0, 255), t_color_short);
      line(x1, y1, x2, y2);
    }
  }
}

function skipToPosition() {
  if (audioStarted && song.isLoaded()) {
    let time = (slider.value() / 100) * song.duration();
    song.jump(time);
  }
}

function togglePlayPause() {
  if (!audioStarted) {
    userStartAudio();
    song.loop();
    audioStarted = true;
    playPauseButton.html('pause :<');
  } else {
    if (song.isPlaying()) {
      song.pause();
      playPauseButton.html('play :D');
    } else {
      song.loop();
      playPauseButton.html('pause :|');
    }
  }
}

function windowResized() {
  let container = select('#canvas-container');
  resizeCanvas(container.width, 400);
  peaks = song.getPeaks(width);
}