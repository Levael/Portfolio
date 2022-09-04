class Engine3D {
	constructor (settings) {
		this.canvas = document.querySelector(`#${settings.canvas_id}`);
		this.ctx = this.canvas.getContext('2d');
		this.bgColor = '#272822';	// grey

        this.full_screen_mode = false;

        this.canvas_wrapper     = document.querySelector(`#${settings.canvas_wrapper}`);
        this.icon_width         = window.innerWidth / (100 / settings.canvas_width_percent)     || 300;     // canvas on page (not fullsized)
        this.icon_height        = window.innerHeight / (100 / settings.canvas_height_percent)   || 200;

		// width, height, tanX, tanY

		this.gar = (110 / 2 * Math.PI) / 180;	// gorisontal angle in radian
		this.dfp = 0.3;		// distance to focal point
		this.mvd = 500;		// max view distance
		this.move_step = 0.2,
		this.view_step = 0.2,

		this.COORDINATE_LINES = {
			main_X: {
				start: {
					x: -7,
					y: 0,
					z: 0,
				},

				end: {
					x: 7,
					y: 0,
					z: 0,
				},

				color: '#FF0000',
				line_width: 1,
			},

			main_Z: {
				start: {
					x: 0,
					y: 0,
					z: -7,
				},

				end: {
					x: 0,
					y: 0,
					z: 7,
				},

				color: '#0000FF',
				line_width: 1,
			},

			main_Y: {
				start: {
					x: 0,
					y: -7,
					z: 0,
				},

				end: {
					x: 0,
					y: 7,
					z: 0,
				},

				color: '#00FF00',
				line_width: 1,
			},
		};

		this.CAMERA = {
			ss: {	// screen senter
				x: 0,
				y: 0,
				z: -20,
			},

			// заранее преобразовать угол в радианы
			direction: {
				Y_angle: 90,
				X_angle: 0,
			},
		};

		// document.body.appendChild(this.canvas);
		this.updCanvasSize(this.icon_width, this.icon_height);
		this.cubeInit();

		this.canvas.requestPointerLock =
			this.canvas.requestPointerLock || this.canvas.mozrequestPointerLock || this.canvas.webkitrequestPointerLock;
		this.canvas.requestFullscreen =
			this.canvas.requestFullscreen || this.canvas.mozRequestFullscreen || this.canvas.webkitRequestFullscreen;

		this.canvas.addEventListener('click', () => { this.logInTo_3DMode() });

		document.addEventListener('keydown', (key) => { this.keySwitch(key) });

		document.addEventListener('pointerlockchange', () => { this.logOutFrom_3DMode() });

        window.addEventListener('resize', () => {
            if (this.full_screen_mode) {
                this.updCanvasSize();
            } else {
                // standart small canvas size
                this.updCanvasSize(window.innerWidth / 4, window.innerHeight / 4);
            }
        });
	}

	// ENVIROMENTAL FUNCTIONS =================================================

	updCanvasSize (width = window.innerWidth, height = window.innerHeight) {
		this.width  = this.canvas.width  = width;
		this.height = this.canvas.height = height;

		this.tanX = Math.tan(this.gar) * this.dfp;
		this.tanY = (this.tanX * this.height) / this.width;

		this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
	}

	logInTo_3DMode () {
		console.log('loged in to 3D mode');
        this.full_screen_mode = true;

		this.canvas.addEventListener('mousemove', this.canvas.fn = (mouse_event) => {
			this.rotateCamera(-mouse_event.movementX * this.view_step, -mouse_event.movementY * this.view_step);
		});

		this.canvas.requestPointerLock();
		this.canvas.requestFullscreen();
		this.animate = true;
		this.startAnimation();
	}

	logOutFrom_3DMode () {
		if (document.pointerLockElement != this.canvas) {	// функция вызывается после изменения блокировщика экрана
            this.full_screen_mode = false;

			this.canvas.removeEventListener('mousemove', this.canvas.fn);
			this.animate = false;
            this.updCanvasSize(this.icon_width, this.icon_height);

			console.log('loged out from 3D mode');
		}
	}

	keySwitch (key) {
		if (document.pointerLockElement != this.canvas) return;	//  значит что работает только если активирован 3Д режим

		switch (key.keyCode) {
			// 87:W, 83:S, 65:A, 68:D
			case 87:
				this.moveForward(this.move_step);
				break;
			case 83:
				this.moveBack(this.move_step);
				break;
			default:
				console.log(key.keyCode);	// просто выводит код клавиши
		}
	}

	startAnimation () {
		this.animationLoop();	// 60 fps by default
	}

	animationLoop () {
		this.drawNewFrame();

		if (this.animate) {
			requestAnimationFrame(() => { this.animationLoop() });
		}
	}

	// DRAWING FUNCTIONS =====================================================

	clearCanvas () {
		this.ctx.fillStyle = this.bgColor;
		this.ctx.fillRect(-(this.width/2), -(this.height/2), this.width, this.height);	// из-за центрированния
	}

	drawPoint (x, y, color = '#CCCCCC') {		// серый по умолчанию
		let point_size = 6;
		this.ctx.fillStyle = color;
		this.ctx.fillRect(x - (point_size/2), -y - (point_size/2), point_size, point_size);
	}

	drawLine (start, end, color = '#FFDD21', line_width = 1) {	// жёлтый по умолчанию
		this.ctx.strokeStyle = color;
		this.ctx.lineWidth = line_width;

		this.ctx.beginPath();
		this.ctx.moveTo(start.x, -start.y);
		this.ctx.lineTo(end.x, -end.y);
		this.ctx.stroke();
	}

	// CAMERA FUNCTIONS =======================================================

	setDirection_fromR (Y_angle, X_angle) {	// R == radians
		this.CAMERA.direction.Y_angle = Y_angle * 180 / Math.PI;
		this.CAMERA.direction.X_angle = X_angle * 180 / Math.PI;
	}

	getDirection_inR () {	// R == radians
		return {Y_angle: (this.CAMERA.direction.Y_angle * Math.PI) / 180, X_angle: (this.CAMERA.direction.X_angle * Math.PI) / 180};
	}

	moveForward (move_step = 1) {
		let R_angles = this.getDirection_inR();

		this.CAMERA.ss.x += move_step * (Math.cos(R_angles.Y_angle) * Math.cos(R_angles.X_angle));
		this.CAMERA.ss.y += move_step * (Math.sin(R_angles.X_angle));
		this.CAMERA.ss.z += move_step * (Math.sin(R_angles.Y_angle) * Math.cos(R_angles.X_angle));
	}

	moveBack (move_step = 1) {
		let R_angles = this.getDirection_inR();

		this.CAMERA.ss.x -= move_step * (Math.cos(R_angles.Y_angle) * Math.cos(R_angles.X_angle));
		this.CAMERA.ss.y -= move_step * (Math.sin(R_angles.X_angle));
		this.CAMERA.ss.z -= move_step * (Math.sin(R_angles.Y_angle) * Math.cos(R_angles.X_angle));
	}

	rotateCamera (Y_angle, X_angle) {	// looking to Z, but rotating X
		this.CAMERA.direction.Y_angle = (this.CAMERA.direction.Y_angle + Y_angle) % 360;
		let new_X_angle = (this.CAMERA.direction.X_angle + X_angle) % 360;

		switch (true) {
			case (new_X_angle > 90):
				this.CAMERA.direction.X_angle = 90;
				break;
			case (new_X_angle < -90):
				this.CAMERA.direction.X_angle = -90;
				break;
			default:
				this.CAMERA.direction.X_angle = new_X_angle;
		}
	}

	// SCENE FUNCTIONS =======================================================

	showPoint (point) {
		let new_3D_coords_YX = this.getNew3D_PointCoods(point),
			get_2D_coords = this.getFlattenedPoint(new_3D_coords_YX);

		if (get_2D_coords.status == 'not_seen') return;

		let screen_x = get_2D_coords.x,
			screen_y = get_2D_coords.y;

		this.drawPoint(screen_x, screen_y, point.color);
	}

	showPointsArray (points) {
		for (let point in points) {
			this.showPoint(points[point]);
		}
	}

	showLine (point_1, point_2, color, line_width) {
		let new_3D_coords_YX_1 = this.getNew3D_PointCoods(point_1),
			new_3D_coords_YX_2 = this.getNew3D_PointCoods(point_2),

			new_3D_coords_YX_1_obj = {x: new_3D_coords_YX_1[0], y: new_3D_coords_YX_1[1], z: new_3D_coords_YX_1[2]},
			new_3D_coords_YX_2_obj = {x: new_3D_coords_YX_2[0], y: new_3D_coords_YX_2[1], z: new_3D_coords_YX_2[2]},

			line_coords_2D = this.getFlattenedLine({sp: new_3D_coords_YX_1_obj, ep: new_3D_coords_YX_2_obj});

		// console.log(line_coords_2D);

		if (line_coords_2D == 'not_seen') {
			return;
		};

		this.drawLine(line_coords_2D.sp, line_coords_2D.ep, color, line_width);
	}

	showCubeBorder (points = this.cube_vertexes, color, line_width) {
		this.showLine(points[0], points[1], color, line_width);
		this.showLine(points[1], points[2], color, line_width);
		this.showLine(points[2], points[3], color, line_width);
		this.showLine(points[3], points[0], color, line_width);

		this.showLine(points[4], points[5], color, line_width);
		this.showLine(points[5], points[6], color, line_width);
		this.showLine(points[6], points[7], color, line_width);
		this.showLine(points[7], points[4], color, line_width);

		this.showLine(points[0], points[4], color, line_width);
		this.showLine(points[1], points[5], color, line_width);
		this.showLine(points[2], points[6], color, line_width);
		this.showLine(points[3], points[7], color, line_width);

		// bottom
		// this.showLine(points[0], points[2]);
		// this.showLine(points[1], points[3]);

		// //left
		// this.showLine(points[1], points[6]);
		// this.showLine(points[2], points[5]);
		return points;
	}

	showCoordinatLines (lines) {
		this.showLine(lines.main_X.start, lines.main_X.end, lines.main_X.color, lines.main_X.line_width);
		this.showLine(lines.main_Z.start, lines.main_Z.end, lines.main_Z.color, lines.main_Z.line_width);
		this.showLine(lines.main_Y.start, lines.main_Y.end, lines.main_Y.color, lines.main_Y.line_width);
	}

	drawNewFrame () {
		this.clearCanvas();
		this.showCoordinatLines(this.COORDINATE_LINES);
		this.showCubeBorder(this.cubeRotate(0.7, 0.8, 0.9), this.cube_color, this.cube_line_width);
	}

	// CALCULATION FUNCTIONS ==================================================

	getFlattenedLine (line3) {
		let line2 = {};

		if (line3.sp.z > 0 && line3.ep.z > 0) {
			// normal calculation

			line2.sp = this.getFlattenedPoint(line3.sp);
			line2.ep = this.getFlattenedPoint(line3.ep);
		} else {
			if (line3.sp.z < 0 && line3.ep.z < 0) {
				line2 = 'not_seen';
			} else {
				// one point is up, one is down

				let [point_up, point_down] = (line3.sp.z > 0) ? [line3.sp, line3.ep] : [line3.ep, line3.sp];

				line2.sp = this.getFlattenedPoint(point_up);
				line2.ep = this.getScreenIntersectPoint(line3);
			}
		}

		return line2;
	}

	getFlattenedPoint (point3) {
		let point2 = {};

		if (point3.z <= 0) alert('<= 0');

		point2.x = (point3.x * this.dfp) / (point3.z + this.dfp);
		point2.y = (point3.y * this.dfp) / (point3.z + this.dfp);

		point2.x = ((this.width  / 2) * point2.x) / this.tanX;
		point2.y = ((this.height / 2) * point2.y) / this.tanY;

		return point2;
	}

	getScreenIntersectPoint (line3) {
		let kt2 = (line3.sp.z - line3.ep.z) / (line3.sp.x - line3.ep.x),
			bt2 = line3.sp.z - kt2 * line3.sp.x,

			ks2 = (line3.sp.z - line3.ep.z) / (line3.sp.y - line3.ep.y),
			bs2 = line3.sp.z - ks2 * line3.sp.y;

		let common_point = {};
		common_point.x = (bt2) / (-kt2);
		common_point.y = (bs2) / (-ks2);

		if (kt2 == Infinity || kt2 == -Infinity) {
			// lne is vertical
			common_point.x = line3.sp.x;
		}

		if (ks2 == Infinity || ks2 == -Infinity) {
			// lne is gorisontal
			common_point.y = line3.sp.y;
		}

		common_point.x = ((this.width  / 2) * common_point.x) / this.tanX;
		common_point.y = ((this.height / 2) * common_point.y) / this.tanY;

		return common_point;
	}

	// MATRIXES FUNCTIONS =====================================================

	getRotationMatrixAround_Y (angle) {
		let cosY = Math.cos((angle * Math.PI) / 180),
			sinY = Math.sin((angle * Math.PI) / 180),

		matrix_Y = [
			[cosY, 0, -sinY],
			[0, 1, 0],
			[sinY, 0, cosY]
		];

		return matrix_Y;
	}

	getRotationMatrixAround_X (angle) {
		let cosX = Math.cos((angle * Math.PI) / 180),
			sinX = Math.sin((angle * Math.PI) / 180),

		matrix_X = [
			[1, 0, 0],
			[0, cosX, sinX],
			[0, -sinX, cosX]
		];

		return matrix_X;
	}

	getRotationMatrixAround_Z (angle) {
		let cosZ = Math.cos((angle * Math.PI) / 180),
			sinZ = Math.sin((angle * Math.PI) / 180),

		matrix_Z = [
			[cosZ, sinZ, 0],
			[-sinZ, cosZ, 0],
			[0, 0, 1]
		];

		return matrix_Z;
	}

	// можно потом оптимизировать чтобы не переводить постоянно в массив и обратно
	getRotatedPointCoord (point_coords, matrix) {
		let new_coords = [0, 0, 0];

		for (let basic_coord in point_coords) {
			for (let basic_value in matrix[basic_coord]) {
				new_coords[basic_value] += point_coords[basic_coord] * matrix[basic_coord][basic_value];
			}
		}

		return [new_coords[0], new_coords[1], new_coords[2]];
	}

	getNew3D_PointCoods (point) {
		let rel_point_position = [point.x - this.CAMERA.ss.x, point.y - this.CAMERA.ss.y, point.z - this.CAMERA.ss.z],
			matrix_Y = this.getRotationMatrixAround_Y(this.CAMERA.direction.Y_angle - 90),
			matrix_X = this.getRotationMatrixAround_X(this.CAMERA.direction.X_angle),
			new_3D_coords_Y = this.getRotatedPointCoord(rel_point_position, matrix_Y),	// 1!
			new_3D_coords_YX = this.getRotatedPointCoord(new_3D_coords_Y, matrix_X);	// 2!
		return new_3D_coords_YX;
	}

	// CUBE FUNCTIONS =========================================================

	cubeInit (center_point = {x:0,y:0,z:0}, edge_size = 3) {
		this.cube_position = {
			x: center_point.x,
			y: center_point.y,
			z: center_point.z,
		};

		this.cube_rib_size = edge_size;
		this.cube_line_width = 3;
		this.cube_rib_color = '#4465DE';	// голубой

		this.cube_vertexes = [];

		let hb = edge_size / 2,		// half_rib
			cp = center_point;

		// p = positive, n = negative
		let bottom_pXpZ = {x:cp.x+hb, y:cp.y-hb, z:cp.z+hb},
			bottom_nXpZ = {x:cp.x-hb, y:cp.y-hb, z:cp.z+hb},
			bottom_nXnZ = {x:cp.x-hb, y:cp.y-hb, z:cp.z-hb},
			bottom_pXnZ = {x:cp.x+hb, y:cp.y-hb, z:cp.z-hb},

			top_pXpZ 	= {x:cp.x+hb, y:cp.y+hb, z:cp.z+hb},
			top_nXpZ 	= {x:cp.x-hb, y:cp.y+hb, z:cp.z+hb},
			top_nXnZ 	= {x:cp.x-hb, y:cp.y+hb, z:cp.z-hb},
			top_pXnZ 	= {x:cp.x+hb, y:cp.y+hb, z:cp.z-hb};

		this.cube_vertexes = [bottom_pXpZ, bottom_nXpZ, bottom_nXnZ, bottom_pXnZ, top_pXpZ, top_nXpZ, top_nXnZ, top_pXnZ];
	}

	cubeRotate (Y_angle = 0, X_angle = 0, Z_angle = 0) {	// по часовой
		let cube = this.cube_vertexes, rotatedVertexCoords;

		if (Y_angle != 0) {
			let matrix_Y = this.getRotationMatrixAround_Y(Y_angle);

			for (let vertex in cube) {
				rotatedVertexCoords = this.getRotatedPointCoord([cube[vertex].x, cube[vertex].y, cube[vertex].z], matrix_Y);
				cube[vertex] = {x:rotatedVertexCoords[0], y:rotatedVertexCoords[1], z:rotatedVertexCoords[2]};
			}
		}

		if (X_angle != 0) {
			let matrix_X = this.getRotationMatrixAround_X(X_angle);

			for (let vertex in cube) {
				rotatedVertexCoords = this.getRotatedPointCoord([cube[vertex].x, cube[vertex].y, cube[vertex].z], matrix_X);
				cube[vertex] = {x:rotatedVertexCoords[0], y:rotatedVertexCoords[1], z:rotatedVertexCoords[2]};
			}
		}

		if (Z_angle != 0) {
			let matrix_Z = this.getRotationMatrixAround_Z(Z_angle);

			for (let vertex in cube) {
				rotatedVertexCoords = this.getRotatedPointCoord([cube[vertex].x, cube[vertex].y, cube[vertex].z], matrix_Z);
				cube[vertex] = {x:rotatedVertexCoords[0], y:rotatedVertexCoords[1], z:rotatedVertexCoords[2]};
			}
		}

		this.cube_vertexes = cube;
		return cube;
	}

}
