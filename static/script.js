const rowsContainer = document.getElementById("vocabRows");
const refreshButton = document.getElementById("refreshButton");
const plot = document.getElementById("vectorPlot");

function displayToken(token) {
	return token === " " ? "[space]" : token;
}

function vectorText(vector) {
	return `[${vector.map((n) => Number(n).toFixed(4)).join(", ")}]`;
}

function normalizeEntries(vocabData) {
	return Object.entries(vocabData)
		.map(([token, info]) => ({ token, id: info.id, embedding: info.embedding }))
		.sort((a, b) => a.id - b.id);
}

function renderRows(entries) {
	rowsContainer.innerHTML = "";

	for (const entry of entries) {
		const row = document.createElement("div");
		row.className = "flow-row";
		row.innerHTML = `
			<span class="token">${displayToken(entry.token)}</span>
			<span class="arrow">-></span>
			<span class="index">${entry.id}</span>
			<span class="arrow">-></span>
			<span class="vector">${vectorText(entry.embedding)}</span>
		`;
		rowsContainer.appendChild(row);
	}
}

function createSvgElement(tag, attrs) {
	const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
	for (const [key, value] of Object.entries(attrs)) {
		el.setAttribute(key, value);
	}
	return el;
}

function drawPlot(entries) {
	plot.innerHTML = "";

	const width = 700;
	const height = 420;
	const padding = 48;

	const xs = entries.map((e) => e.embedding[0]);
	const ys = entries.map((e) => e.embedding[1]);

	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	const xSpan = maxX - minX || 1;
	const ySpan = maxY - minY || 1;

	const toX = (x) => padding + ((x - minX) / xSpan) * (width - padding * 2);
	const toY = (y) => height - padding - ((y - minY) / ySpan) * (height - padding * 2);

	plot.appendChild(
		createSvgElement("line", {
			x1: padding,
			y1: height - padding,
			x2: width - padding,
			y2: height - padding,
			stroke: "#98a1c6",
			"stroke-width": "1.2"
		})
	);

	plot.appendChild(
		createSvgElement("line", {
			x1: padding,
			y1: padding,
			x2: padding,
			y2: height - padding,
			stroke: "#98a1c6",
			"stroke-width": "1.2"
		})
	);

	const labels = [
		{ text: `x min ${minX.toFixed(3)}`, x: padding, y: height - 14, anchor: "start" },
		{ text: `x max ${maxX.toFixed(3)}`, x: width - padding, y: height - 14, anchor: "end" },
		{ text: `y min ${minY.toFixed(3)}`, x: 8, y: height - padding + 4, anchor: "start" },
		{ text: `y max ${maxY.toFixed(3)}`, x: 8, y: padding + 4, anchor: "start" }
	];

	for (const label of labels) {
		plot.appendChild(
			createSvgElement("text", {
				x: label.x,
				y: label.y,
				fill: "#5b6078",
				"font-size": "12",
				"text-anchor": label.anchor
			})
		).textContent = label.text;
	}

	for (const entry of entries) {
		const cx = toX(entry.embedding[0]);
		const cy = toY(entry.embedding[1]);

		plot.appendChild(
			createSvgElement("circle", {
				cx,
				cy,
				r: "5",
				fill: "#006d77",
				opacity: "0.9"
			})
		);

		plot.appendChild(
			createSvgElement("text", {
				x: cx + 7,
				y: cy - 6,
				fill: "#1f2540",
				"font-size": "12"
			})
		).textContent = displayToken(entry.token);
	}
}

async function loadVocab() {
	rowsContainer.textContent = "Loading vocab...";

	try {
		const response = await fetch("/vocab");
		if (!response.ok) {
			throw new Error(`Request failed with ${response.status}`);
		}

		const vocabData = await response.json();
		const entries = normalizeEntries(vocabData);
		renderRows(entries);
		drawPlot(entries);
	} catch (error) {
		rowsContainer.textContent = "Failed to load vocab data.";
		plot.innerHTML = "";
		console.error(error);
	}
}

refreshButton.addEventListener("click", loadVocab);
loadVocab();
