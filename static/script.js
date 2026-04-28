const rowsContainer = document.getElementById("vocabRows");
const refreshButton = document.getElementById("refreshButton");
const plot = document.getElementById("vectorPlot");
const positionRowsContainer = document.getElementById("positionRows");
const positionPlot = document.getElementById("positionPlot");
const embedForm = document.getElementById("embedForm");
const embedInput = document.getElementById("embedInput");
const embedStatus = document.getElementById("embedStatus");
const embedRows = document.getElementById("embedRows");
const embedPlot = document.getElementById("embedPlot");
const embedPositionPlot = document.getElementById("embedPositionPlot");
const embedFinalPlot = document.getElementById("embedFinalPlot");

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

function normalizePositionEntries(positionData) {
	return Object.values(positionData)
		.map((info) => ({
			position: info.position ?? info.id,
			embedding: info.embedding
		}))
		.sort((a, b) => a.position - b.position);
}

function renderPositionRows(entries) {
	positionRowsContainer.innerHTML = "";

	for (const entry of entries) {
		const row = document.createElement("div");
		row.className = "flow-row pos-row";
		row.innerHTML = `
			<span class="index">${entry.position}</span>
			<span class="arrow">-></span>
			<span class="vector">${vectorText(entry.embedding)}</span>
		`;
		positionRowsContainer.appendChild(row);
	}
}

function drawPositionPlot(entries) {
	positionPlot.innerHTML = "";

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

	positionPlot.appendChild(
		createSvgElement("line", {
			x1: padding, y1: height - padding,
			x2: width - padding, y2: height - padding,
			stroke: "#98a1c6", "stroke-width": "1.2"
		})
	);

	positionPlot.appendChild(
		createSvgElement("line", {
			x1: padding, y1: padding,
			x2: padding, y2: height - padding,
			stroke: "#98a1c6", "stroke-width": "1.2"
		})
	);

	const labels = [
		{ text: `x min ${minX.toFixed(3)}`, x: padding, y: height - 14, anchor: "start" },
		{ text: `x max ${maxX.toFixed(3)}`, x: width - padding, y: height - 14, anchor: "end" },
		{ text: `y min ${minY.toFixed(3)}`, x: 8, y: height - padding + 4, anchor: "start" },
		{ text: `y max ${maxY.toFixed(3)}`, x: 8, y: padding + 4, anchor: "start" }
	];

	for (const label of labels) {
		positionPlot.appendChild(
			createSvgElement("text", {
				x: label.x, y: label.y,
				fill: "#5b6078", "font-size": "12", "text-anchor": label.anchor
			})
		).textContent = label.text;
	}

	for (const entry of entries) {
		const cx = toX(entry.embedding[0]);
		const cy = toY(entry.embedding[1]);

		positionPlot.appendChild(
			createSvgElement("circle", { cx, cy, r: "5", fill: "#c77dff", opacity: "0.9" })
		);

		positionPlot.appendChild(
			createSvgElement("text", {
				x: cx + 7, y: cy - 6,
				fill: "#1f2540", "font-size": "12"
			})
		).textContent = entry.position;
	}
}

async function loadPosition() {
	positionRowsContainer.textContent = "Loading positions...";

	try {
		const response = await fetch("/position");
		if (!response.ok) throw new Error(`Request failed with ${response.status}`);

		const positionData = await response.json();
		const entries = normalizePositionEntries(positionData);
		renderPositionRows(entries);
		drawPositionPlot(entries);
	} catch (error) {
		positionRowsContainer.textContent = "Failed to load position data.";
		positionPlot.innerHTML = "";
		console.error(error);
	}
}

function normalizeEmbedEntries(embedData) {
	return embedData.map((info, index) => ({
		char: info.char,
		embedding: info.character_embedding ?? info.embedding,
		position_embedding: info.position_embedding,
		final_embedding: info.final_embedding,
		index
	}));
}

function renderEmbedRows(entries) {
	embedRows.innerHTML = "";

	for (const entry of entries) {
		const row = document.createElement("div");
		row.className = "flow-row embed-row";
		row.innerHTML = `
			<span class="index">${entry.index}</span>
			<span class="arrow">-></span>
			<span class="token">${displayToken(entry.char)}</span>
			<span class="arrow">-></span>
			<span class="vector">${vectorText(entry.embedding)}</span>
		`;
		embedRows.appendChild(row);
	}
}

function drawEmbedPlot(entries) {
	embedPlot.innerHTML = "";
	if (entries.length === 0) {
		return;
	}

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

	embedPlot.appendChild(
		createSvgElement("line", {
			x1: padding,
			y1: height - padding,
			x2: width - padding,
			y2: height - padding,
			stroke: "#98a1c6",
			"stroke-width": "1.2"
		})
	);

	embedPlot.appendChild(
		createSvgElement("line", {
			x1: padding,
			y1: padding,
			x2: padding,
			y2: height - padding,
			stroke: "#98a1c6",
			"stroke-width": "1.2"
		})
	);

	for (const entry of entries) {
		const cx = toX(entry.embedding[0]);
		const cy = toY(entry.embedding[1]);

		embedPlot.appendChild(
			createSvgElement("circle", {
				cx,
				cy,
				r: "5",
				fill: "#ef476f",
				opacity: "0.9"
			})
		);

		embedPlot.appendChild(
			createSvgElement("text", {
				x: cx + 7,
				y: cy - 6,
				fill: "#1f2540",
				"font-size": "12"
			})
		).textContent = `${displayToken(entry.char)}:${entry.index}`;
	}
}

function drawEmbedPositionPlot(entries) {
	embedPositionPlot.innerHTML = "";
	if (entries.length === 0 || !entries[0].position_embedding) {
		return;
	}

	const width = 700;
	const height = 420;
	const padding = 48;

	const xs = entries.map((e) => e.position_embedding[0]);
	const ys = entries.map((e) => e.position_embedding[1]);

	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	const xSpan = maxX - minX || 1;
	const ySpan = maxY - minY || 1;

	const toX = (x) => padding + ((x - minX) / xSpan) * (width - padding * 2);
	const toY = (y) => height - padding - ((y - minY) / ySpan) * (height - padding * 2);

	embedPositionPlot.appendChild(
		createSvgElement("line", {
			x1: padding,
			y1: height - padding,
			x2: width - padding,
			y2: height - padding,
			stroke: "#98a1c6",
			"stroke-width": "1.2"
		})
	);

	embedPositionPlot.appendChild(
		createSvgElement("line", {
			x1: padding,
			y1: padding,
			x2: padding,
			y2: height - padding,
			stroke: "#98a1c6",
			"stroke-width": "1.2"
		})
	);

	for (const entry of entries) {
		const cx = toX(entry.position_embedding[0]);
		const cy = toY(entry.position_embedding[1]);

		embedPositionPlot.appendChild(
			createSvgElement("circle", {
				cx,
				cy,
				r: "5",
				fill: "#a78bfa",
				opacity: "0.9"
			})
		);

		embedPositionPlot.appendChild(
			createSvgElement("text", {
				x: cx + 7,
				y: cy - 6,
				fill: "#1f2540",
				"font-size": "12"
			})
		).textContent = `${displayToken(entry.char)}:${entry.index}`;
	}
}

function drawEmbedFinalPlot(entries) {
	embedFinalPlot.innerHTML = "";
	if (entries.length === 0 || !entries[0].final_embedding) {
		return;
	}

	const width = 700;
	const height = 420;
	const padding = 48;

	const xs = entries.map((e) => e.final_embedding[0]);
	const ys = entries.map((e) => e.final_embedding[1]);

	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	const xSpan = maxX - minX || 1;
	const ySpan = maxY - minY || 1;

	const toX = (x) => padding + ((x - minX) / xSpan) * (width - padding * 2);
	const toY = (y) => height - padding - ((y - minY) / ySpan) * (height - padding * 2);

	embedFinalPlot.appendChild(
		createSvgElement("line", {
			x1: padding,
			y1: height - padding,
			x2: width - padding,
			y2: height - padding,
			stroke: "#98a1c6",
			"stroke-width": "1.2"
		})
	);

	embedFinalPlot.appendChild(
		createSvgElement("line", {
			x1: padding,
			y1: padding,
			x2: padding,
			y2: height - padding,
			stroke: "#98a1c6",
			"stroke-width": "1.2"
		})
	);

	for (const entry of entries) {
		const cx = toX(entry.final_embedding[0]);
		const cy = toY(entry.final_embedding[1]);

		embedFinalPlot.appendChild(
			createSvgElement("circle", {
				cx,
				cy,
				r: "5",
				fill: "#06b6d4",
				opacity: "0.9"
			})
		);

		embedFinalPlot.appendChild(
			createSvgElement("text", {
				x: cx + 7,
				y: cy - 6,
				fill: "#1f2540",
				"font-size": "12"
			})
		).textContent = `${displayToken(entry.char)}:${entry.index}`;
	}
}

async function loadTextEmbedding(text) {
	embedStatus.textContent = "Loading text embeddings...";
	embedRows.textContent = "";

	try {
		const response = await fetch(`/embed_text?text=${encodeURIComponent(text)}`);
		if (!response.ok) throw new Error(`Request failed with ${response.status}`);

		const embedData = await response.json();
		const entries = normalizeEmbedEntries(embedData);
		renderEmbedRows(entries);
		drawEmbedPlot(entries);
		drawEmbedPositionPlot(entries);
		drawEmbedFinalPlot(entries);
		embedStatus.textContent = `Embedded ${entries.length} characters.`;
	} catch (error) {
		embedStatus.textContent = "Failed to load text embeddings.";
		embedRows.textContent = "";
		embedPlot.innerHTML = "";
		embedPositionPlot.innerHTML = "";
		embedFinalPlot.innerHTML = "";
		console.error(error);
	}
}

embedForm.addEventListener("submit", (event) => {
	event.preventDefault();
	const text = embedInput.value.trim();
	if (!text) {
		embedStatus.textContent = "Type text before submitting.";
		embedRows.textContent = "";
		embedPlot.innerHTML = "";
		return;
	}
	loadTextEmbedding(text);
});

refreshButton.addEventListener("click", () => {
	loadVocab();
	loadPosition();
});

loadVocab();
loadPosition();
