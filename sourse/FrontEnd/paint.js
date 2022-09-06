class PaintGame {

    constructor (settings) {
		this.canvas = document.querySelector(`#${settings.canvas_id}`);

        this.radius = 0.5;
        this.pen_color = "#000000";
        this.basic_color = "#B3F2FE";
        this.isMouseDown = false;
        this.coords = [];
        // this.image_id = 1;	// start from 1
        // this.speed = 5;		// miliseconds for replay function
        this.percent_width = settings.canvas_width_percent;
        this.percent_height = settings.canvas_height_percent;
        this.canvas_wrapper = document.querySelector(`#${settings.canvas_wrapper}`);
	}

	init () {
        this.ctx = this.canvas.getContext("2d");
        this.icon_width         = this.canvas.offsetWidth;      // gets width and height from css, after that reinitialize them as needed
        this.icon_height        = this.canvas.offsetHeight;
        // this.canvas.width = window.innerWidth / (100 / this.percent_width)     || 300;
        // this.canvas.height = window.innerHeight / (100 / this.percent_height)  || 200;
        this.ctx.lineWidth = this.radius * 2;
        this.ctx.strokeStyle = this.pen_color;


        console.log("'c' - clear screen\r\n's' - save the image\r\n'r' - redraw the image");

        // this.canvas.addEventListener('mousemove', (e) => {this.MouseMove(e)});
        // this.canvas.addEventListener('mousedown', (e) => {this.MouseDown(e)});
        // this.canvas.addEventListener('mouseup', (e) => {this.MouseUp(e)});
        // document.addEventListener('keydown', (e) => {this.KeyBoard(e)});

        this.canvas.addEventListener('click', () => {
            let wrapper = this.canvas_wrapper;

            if (wrapper.requestFullscreen) {				// Default
                wrapper.requestFullscreen();
            } else if (wrapper.mozRequestFullScreen) {		// Firefox
                wrapper.mozRequestFullScreen();
            } else if (wrapper.webkitRequestFullscreen) {	// Chrome, Safari & Opera
                wrapper.webkitRequestFullscreen();
            } else if (wrapper.msRequestFullscreen) {		// IE/Edge
                wrapper.msRequestFullscreen();
            }

            // console.log(window.screen.width);
            // console.log(window.screen.height);

            // console.log(window.innerWidth);
            // console.log(window.innerHeight);

            // console.log(this.canvas.width);
            // console.log(this.canvas.height);
            //
            // this.canvas.width = window.innerWidth;
            // this.canvas.height = window.innerHeight;
            //
            // console.log(this.canvas.width);
            // console.log(this.canvas.height);
        });

        // console.log(window.screen.width);
        // console.log(window.screen.height);

        // document.addEventListener("fullscreenchange", function () {
        //     // console.log(window.screen.width);
        //     // console.log(window.screen.height);
        // }, false);


        this.ClearScreen();



	}

    ClearScreen () {
    	this.ctx.fillStyle = this.basic_color;
    	this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    	// this.ctx.beginPath();
    	// this.ctx.fillStyle = 'black';
    }

    // DrawingCode (e) {
    //     // console.log(12345);
    //     // console.log(this.coords);
    // 	this.ctx.lineTo(e.clientX, e.clientY);
    // 	this.ctx.stroke();
    //
    // 	this.ctx.beginPath();
    // 	this.ctx.arc(e.clientX, e.clientY, this.radius, 0, Math.PI * 2);
    // 	this.ctx.fill();
    //
    // 	this.ctx.beginPath();
    // 	this.ctx.moveTo(e.clientX, e.clientY);
    // }
    //
    // FirstDot (e) {
    // 	this.ctx.beginPath();
    // 	this.ctx.arc(e.clientX, e.clientY, this.radius, 0, Math.PI * 2);
    // 	this.ctx.fill();
    //
    // 	this.ctx.beginPath();
    // 	this.ctx.moveTo(e.clientX, e.clientY);
    // 	// точка становится жирной если отключить последние две строки и я не знаю почему
    // }
    //
    // MouseMove (e) {
    // 	if (this.isMouseDown) {
    // 		this.coords.push([e.clientX, e.clientY]);
    // 		this.DrawingCode(e);
    // 	}
    // }
    //
    // MouseMove (e) {
    // 	if (this.isMouseDown) {
    // 		this.coords.push([e.clientX, e.clientY]);
    // 		this.DrawingCode(e);
    // 	}
    // }
    //
    // MouseDown (e) {
    // 	this.isMouseDown = true;
    // 	this.FirstDot(e);
    // 	this.coords.push([e.clientX, e.clientY]);
    // }
    //
    // MouseUp (e) {
    // 	this.isMouseDown = false;
    // 	this.ctx.beginPath();
    // 	this.coords.push('space');	// костыль
    // }
    //
    // KeyBoard (e) {
    // 	if (e.keyCode == 67) {
    // 		this.ClearScreen();
    // 	}
    //
    // 	if (e.keyCode == 83) {
    // 		this.SaveImage();
    // 	}
    //
    // 	if (e.keyCode == 82) {
    // 		this.RedrawImage();
    // 	}
    // }
    //

    //
    // SaveImage () {
    // 	localStorage.setItem(toString('Image_' + this.image_id), JSON.stringify(this.coords));
    // 	this.image_id++;
    // }
    //
    // RedrawImage () {
    // 	this.coords = JSON.parse(localStorage.getItem(toString('image_' + this.image_id - 1)));
    // 	this.ClearScreen();
    // 	this.Replay();
    // }
    //
    // Replay () {
    // 	this.coords.reverse();	// only for optimisation
    //
    // 	let timer = setInterval(function() {
    // 		if (!this.coords.length) {
    // 			clearInterval(timer);
    // 			this.ctx.beginPath();
    // 			return
    // 		}
    //
    // 		let coord = this.coords.pop(),	// only for optimisation
    // 			e = {
    // 				clientX: coord["0"],
    // 				clientY: coord["1"]
    // 			};
    //
    // 		this.DrawingCode(e);
    //
    // 	}, this.speed);
    // }
}
