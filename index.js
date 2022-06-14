const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const startGameButton = document.querySelector('#startGame');
let cellsHorizontal = 15;
let cellsVertical = 10;


const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;
const render = Render.create({
	element: document.body,
	engine: engine,
	options: {
		width,
		height,
		wireframes: false
	}
});
Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
	Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
	Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
	Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
	Bodies.rectangle(width, height / 2, 2, height, { isStatic: true })
];

World.add(world, walls);

// Maze Generation

const shuffle = (arr) => {
	let counter = arr.length;
	while (counter > 0) {
		const index = Math.floor(Math.random() * counter);

		counter--;

		const temp = arr[counter];
		arr[counter] = arr[index];
		arr[index] = temp;
	}

	return arr;
};

const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false));
const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal - 1).fill(false));
const horizontals = Array(cellsVertical - 1).fill(null).map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const pathFinder = (row, column) => {
	// if I have visited the cell at [row,column] then return
	if (grid[row][column]) {
		return;
	}
	// mark cell as being visited
	grid[row][column] = true;

	// assemble randomly-ordered list of neighbors
	const neighbors = shuffle([
		[ row - 1, column, 'up' ],
		[ row, column + 1, 'right' ],
		[ row + 1, column, 'down' ],
		[ row, column - 1, 'left' ]
	]);

	// for each neighbor...
	for (let neighbor of neighbors) {
		const [ nextRow, nextColumn, direction ] = neighbor;
		// see if neighbor is out of bounds
		if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
			continue;
		}
		// if we have visited that neightbor, continue to next neighbor
		if (grid[nextRow][nextColumn]) {
			continue;
		}

		// remove wall from horizontals or verticals
		if (direction === 'left') {
			verticals[row][column - 1] = true;
		} else if (direction === 'right') {
			verticals[row][column] = true;
		} else if (direction === 'up') {
			horizontals[row - 1][column] = true;
		} else if (direction === 'down') {
			horizontals[row][column] = true;
		}
		pathFinder(nextRow, nextColumn);
	}

	// Visit next cell
};

pathFinder(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}
		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX / 2,
			rowIndex * unitLengthY + unitLengthY,
			unitLengthX,
			10,
			{
				label: 'wall',
				isStatic: true,
				render: {
					fillStyle: 'red'
				}
			}
		);
		World.add(world, wall);
	});
});

verticals.forEach((row, rowIndex) => {
	row.forEach((open, columnIndex) => {
		if (open) {
			return;
		}
		const wall = Bodies.rectangle(
			columnIndex * unitLengthX + unitLengthX,
			rowIndex * unitLengthY + unitLengthY / 2,
			10,
			unitLengthY,
			{
				label: 'wall',
				isStatic: true,
				render: {
					fillStyle: 'red'
				}
			}
		);
		World.add(world, wall);
	});
});

// Goal
const goal = Bodies.rectangle(width - unitLengthX / 2, height - unitLengthY / 2, unitLengthX * 0.6, unitLengthY * 0.6, {
	isStatic: true,
	label: 'goal',
	render: {
		fillStyle: 'lime'
	}
});
World.add(world, goal);

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
	label: 'ball',
	render: {
		fillStyle: 'cyan'
	}
});
World.add(world, ball);

document.addEventListener('keydown', (event) => {
	const { x, y } = ball.velocity;
	if (event.keyCode === 87) {
		Body.setVelocity(ball, { x, y: y - 5 });
	}
	if (event.keyCode === 68) {
		Body.setVelocity(ball, { x: +5, y });
	}
	if (event.keyCode === 83) {
		Body.setVelocity(ball, { x, y: y + 5 });
	}
	if (event.keyCode === 65) {
		Body.setVelocity(ball, { x: -5, y });
	}
});

// Win Condition
const replayButton = document.querySelector('#playAgain');
const restartGame = () => {
	window.location.reload();
};
Events.on(engine, 'collisionStart', (event) => {
	event.pairs.forEach((collision) => {
		const labels = [ 'ball', 'goal' ];

		if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
			document.querySelector('.winner').classList.remove('hidden');
			replayButton.classList.remove('hidden');
			replayButton.addEventListener('click', restartGame);
			world.gravity.y = 1;
			world.bodies.forEach((body) => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				}
			});
		}
	});
});
