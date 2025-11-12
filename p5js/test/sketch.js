function setup() {
  createCanvas(400, 400);
}

function draw() {
  // background(220);

  //circle in the center with a width of 100
  if (mouseIsPressed === true) {
    fill(0);
  } else {
    fill(255);
  }
  
  fill("yellow")
  circle(mouseX, mouseY, 100);
}


