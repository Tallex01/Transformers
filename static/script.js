const statusElement = document.getElementById("status");
const vocabListElement = document.getElementById("vocab-list");
const encodeFormElement = document.getElementById("encode-form");
const wordInputElement = document.getElementById("word-input");
const encodeStatusElement = document.getElementById("encode-status");
const encodeResultElement = document.getElementById("encode-result");
const vectorSelectElement = document.getElementById("vector-select");
const vectorCaptionElement = document.getElementById("vector-caption");
const vectorPlotElement = document.getElementById("vector-plot");
const allVectorsCaptionElement = document.getElementById("all-vectors-caption");
const allVectorsPlotElement = document.getElementById("all-vectors-plot");

const vectorCache = new Map();

const plotSize = 520;
const plotPadding = 56;

function formatKey(key) {
	return key === " " ? "space" : key;
}

function formatVector(vector) {
	return `[${vector.map((value) => Number(value).toFixed(4)).join(", ")}]`;
}

function formatNumber(value) {
	return Number(value).toFixed(4);
}

function createVocabRow(key, value, vector) {
	const row = document.createElement("div");
	row.className = "vocab-row";

	const keyElement = document.createElement("span");
	keyElement.className = "vocab-key";
	keyElement.textContent = formatKey(key);

	const valueElement = document.createElement("span");
	valueElement.className = "vocab-value";
	valueElement.textContent = value;

	const vectorElement = document.createElement("span");
	vectorElement.className = "vocab-vector";
	vectorElement.textContent = formatVector(vector);

	row.append(keyElement, valueElement, vectorElement);
	return row;
}

function createEncodedValue(value) {
	const item = document.createElement("span");
	item.className = "encoded-item";
	item.textContent = value;
	return item;
}

function buildVectorOption(key) {
	const option = document.createElement("option");
	option.value = key;
	option.textContent = formatKey(key);
	return option;
}

function getPlotGeometry(maxMagnitude) {
	const centerX = plotSize / 2;
	const centerY = plotSize / 2;
	const plotRange = plotSize - plotPadding * 2;

	return {
		centerX,
		centerY,
		plotRange,
		maxMagnitude,
	};
}

function getPointCoordinates(vector, geometry) {
	const xValue = Number(vector[0]);
	const yValue = Number(vector[1]);

	return {
		xValue,
		yValue,
		x: geometry.centerX + (xValue / geometry.maxMagnitude) * (geometry.plotRange / 2),
		y: geometry.centerY - (yValue / geometry.maxMagnitude) * (geometry.plotRange / 2),
	};
}

function createPlotSvg(label) {
	const svgNamespace = "http://www.w3.org/2000/svg";
	const svg = document.createElementNS(svgNamespace, "svg");
	svg.setAttribute("viewBox", `0 0 ${plotSize} ${plotSize}`);
	svg.setAttribute("class", "vector-chart");
	svg.setAttribute("role", "img");
	svg.setAttribute("aria-label", label);
	return { svgNamespace, svg };
}

function appendPlotAxes(svgNamespace, svg, geometry) {
	const verticalAxis = document.createElementNS(svgNamespace, "line");
	verticalAxis.setAttribute("x1", String(geometry.centerX));
	verticalAxis.setAttribute("x2", String(geometry.centerX));
	verticalAxis.setAttribute("y1", String(plotPadding));
	verticalAxis.setAttribute("y2", String(plotSize - plotPadding));
	verticalAxis.setAttribute("class", "vector-axis");
	svg.append(verticalAxis);

	const horizontalAxis = document.createElementNS(svgNamespace, "line");
	horizontalAxis.setAttribute("x1", String(plotPadding));
	horizontalAxis.setAttribute("x2", String(plotSize - plotPadding));
	horizontalAxis.setAttribute("y1", String(geometry.centerY));
	horizontalAxis.setAttribute("y2", String(geometry.centerY));
	horizontalAxis.setAttribute("class", "vector-axis");
	svg.append(horizontalAxis);

	const xAxisLabel = document.createElementNS(svgNamespace, "text");
	xAxisLabel.setAttribute("x", String(plotSize - plotPadding + 8));
	xAxisLabel.setAttribute("y", String(geometry.centerY - 8));
	xAxisLabel.setAttribute("class", "vector-axis-label");
	xAxisLabel.textContent = "x";
	svg.append(xAxisLabel);

	const yAxisLabel = document.createElementNS(svgNamespace, "text");
	yAxisLabel.setAttribute("x", String(geometry.centerX + 8));
	yAxisLabel.setAttribute("y", String(plotPadding - 8));
	yAxisLabel.setAttribute("class", "vector-axis-label");
	yAxisLabel.textContent = "y";
	svg.append(yAxisLabel);

	const negativeXLabel = document.createElementNS(svgNamespace, "text");
	negativeXLabel.setAttribute("x", String(plotPadding));
	negativeXLabel.setAttribute("y", String(geometry.centerY + 22));
	negativeXLabel.setAttribute("text-anchor", "start");
	negativeXLabel.setAttribute("class", "vector-scale-label");
	negativeXLabel.textContent = `-${formatNumber(geometry.maxMagnitude)}`;
	svg.append(negativeXLabel);

	const positiveXLabel = document.createElementNS(svgNamespace, "text");
	positiveXLabel.setAttribute("x", String(plotSize - plotPadding));
	positiveXLabel.setAttribute("y", String(geometry.centerY + 22));
	positiveXLabel.setAttribute("text-anchor", "end");
	positiveXLabel.setAttribute("class", "vector-scale-label");
	positiveXLabel.textContent = formatNumber(geometry.maxMagnitude);
	svg.append(positiveXLabel);

	const positiveYLabel = document.createElementNS(svgNamespace, "text");
	positiveYLabel.setAttribute("x", String(geometry.centerX - 10));
	positiveYLabel.setAttribute("y", String(plotPadding + 6));
	positiveYLabel.setAttribute("text-anchor", "end");
	positiveYLabel.setAttribute("class", "vector-scale-label");
	positiveYLabel.textContent = formatNumber(geometry.maxMagnitude);
	svg.append(positiveYLabel);

	const negativeYLabel = document.createElementNS(svgNamespace, "text");
	negativeYLabel.setAttribute("x", String(geometry.centerX - 10));
	negativeYLabel.setAttribute("y", String(plotSize - plotPadding + 6));
	negativeYLabel.setAttribute("text-anchor", "end");
	negativeYLabel.setAttribute("class", "vector-scale-label");
	negativeYLabel.textContent = `-${formatNumber(geometry.maxMagnitude)}`;
	svg.append(negativeYLabel);

	const origin = document.createElementNS(svgNamespace, "circle");
	origin.setAttribute("cx", String(geometry.centerX));
	origin.setAttribute("cy", String(geometry.centerY));
	origin.setAttribute("r", "4");
	origin.setAttribute("class", "vector-origin");
	svg.append(origin);

	const originLabel = document.createElementNS(svgNamespace, "text");
	originLabel.setAttribute("x", String(geometry.centerX + 8));
	originLabel.setAttribute("y", String(geometry.centerY + 18));
	originLabel.setAttribute("class", "vector-scale-label");
	originLabel.textContent = "(0, 0)";
	svg.append(originLabel);
}

function renderVectorPlot(key) {
	const vector = vectorCache.get(key);

	if (!vector || vector.length < 2) {
		vectorCaptionElement.textContent = "No vector available for the selected character.";
		vectorPlotElement.replaceChildren();
		return;
	}

	const xValue = Number(vector[0]);
	const yValue = Number(vector[1]);
	const maxMagnitude = Math.max(Math.abs(xValue), Math.abs(yValue), 1);
	const geometry = getPlotGeometry(maxMagnitude);
	const pointCoordinates = getPointCoordinates(vector, geometry);
	const { svgNamespace, svg } = createPlotSvg(`Embedding vector plot for ${formatKey(key)}`);

	appendPlotAxes(svgNamespace, svg, geometry);

	const diagonal = document.createElementNS(svgNamespace, "line");
	diagonal.setAttribute("x1", String(geometry.centerX));
	diagonal.setAttribute("y1", String(geometry.centerY));
	diagonal.setAttribute("x2", String(pointCoordinates.x));
	diagonal.setAttribute("y2", String(pointCoordinates.y));
	diagonal.setAttribute("class", "vector-line");
	svg.append(diagonal);

	const point = document.createElementNS(svgNamespace, "circle");
	point.setAttribute("cx", String(pointCoordinates.x));
	point.setAttribute("cy", String(pointCoordinates.y));
	point.setAttribute("r", "7");
	point.setAttribute("class", "vector-point");
	svg.append(point);

	const pointLabel = document.createElementNS(svgNamespace, "text");
	pointLabel.setAttribute("x", String(pointCoordinates.x + 10));
	pointLabel.setAttribute("y", String(pointCoordinates.y - 10));
	pointLabel.setAttribute("class", "vector-value-label");
	pointLabel.textContent = `(${formatNumber(xValue)}, ${formatNumber(yValue)})`;
	svg.append(pointLabel);

	vectorCaptionElement.textContent = `Showing ${formatKey(key)} at x = ${formatNumber(xValue)}, y = ${formatNumber(yValue)}.`;
	vectorPlotElement.replaceChildren(svg);
}

function renderAllVectorsPlot(selectedKey = " ") {
	const entries = Array.from(vectorCache.entries()).filter(([, vector]) => vector && vector.length >= 2);

	if (entries.length === 0) {
		allVectorsCaptionElement.textContent = "Unable to load the vocabulary vector map.";
		allVectorsPlotElement.replaceChildren();
		return;
	}

	const maxMagnitude = Math.max(
		...entries.flatMap(([, vector]) => [Math.abs(Number(vector[0])), Math.abs(Number(vector[1]))]),
		1
	);
	const geometry = getPlotGeometry(maxMagnitude);
	const { svgNamespace, svg } = createPlotSvg("Coordinate plot of all vocabulary embedding vectors");

	appendPlotAxes(svgNamespace, svg, geometry);

	entries.forEach(([key, vector]) => {
		const pointCoordinates = getPointCoordinates(vector, geometry);
		const point = document.createElementNS(svgNamespace, "circle");
		point.setAttribute("cx", String(pointCoordinates.x));
		point.setAttribute("cy", String(pointCoordinates.y));
		point.setAttribute("r", key === selectedKey ? "6" : "4.5");
		point.setAttribute("class", key === selectedKey ? "all-vector-point all-vector-point-active" : "all-vector-point");
		svg.append(point);

		const label = document.createElementNS(svgNamespace, "text");
		label.setAttribute("x", String(pointCoordinates.x + 8));
		label.setAttribute("y", String(pointCoordinates.y - 8));
		label.setAttribute("class", key === selectedKey ? "all-vector-label all-vector-label-active" : "all-vector-label");
		label.textContent = formatKey(key);
		svg.append(label);
	});

	allVectorsCaptionElement.textContent = `Showing all vocabulary vectors together. Highlighted: ${formatKey(selectedKey)}.`;
	allVectorsPlotElement.replaceChildren(svg);
}

function initializeVectorSelector(entries) {
	vectorSelectElement.replaceChildren(
		...entries.map(([key]) => buildVectorOption(key))
	);

	vectorSelectElement.value = " ";
	renderVectorPlot(" ");
	renderAllVectorsPlot(" ");
}

async function encodeWord(word) {
	const response = await fetch(`/encode/${encodeURIComponent(word)}`);

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}

	return response.json();
}

async function getEmbedding(char) {
	const response = await fetch(`/embed?char=${encodeURIComponent(char)}`);

	if (!response.ok) {
		throw new Error(`Request failed with status ${response.status}`);
	}

	return response.json();
}

async function handleEncodeSubmit(event) {
	event.preventDefault();

	const submittedWord = wordInputElement.value;

	if (!submittedWord.trim()) {
		encodeStatusElement.textContent = "Enter a word to see its numeric encoding.";
		encodeResultElement.replaceChildren();
		return;
	}

	encodeStatusElement.textContent = `Encoding \"${submittedWord}\"...`;
	encodeResultElement.replaceChildren();

	try {
		const encodedWord = await encodeWord(submittedWord);
		encodeResultElement.replaceChildren(
			...encodedWord.map((value) => createEncodedValue(value))
		);
		encodeStatusElement.textContent = `Encoded \"${submittedWord}\" successfully.`;
	} catch (error) {
		encodeStatusElement.textContent = "Unable to encode that word.";
		encodeResultElement.replaceChildren();
		console.error(error);
	}
}

async function loadVocabulary() {
	try {
		const response = await fetch("/vocab");

		if (!response.ok) {
			throw new Error(`Request failed with status ${response.status}`);
		}

		const vocabulary = await response.json();
		const entries = Object.entries(vocabulary);
		const vectors = await Promise.all(
			entries.map(([key]) => getEmbedding(key))
		);

		entries.forEach(([key], index) => {
			vectorCache.set(key, vectors[index]);
		});

		vocabListElement.replaceChildren(
			...entries.map(([key, value], index) => createVocabRow(key, value, vectors[index]))
		);

		initializeVectorSelector(entries);

		statusElement.textContent = `Loaded ${entries.length} vocabulary entries with embedding vectors.`;
	} catch (error) {
		statusElement.textContent = "Unable to load vocabulary.";
		vocabListElement.replaceChildren();
		vectorSelectElement.replaceChildren();
		vectorCaptionElement.textContent = "Unable to load vector plot.";
		vectorPlotElement.replaceChildren();
		allVectorsCaptionElement.textContent = "Unable to load the vocabulary vector map.";
		allVectorsPlotElement.replaceChildren();
		console.error(error);
	}
}

encodeFormElement.addEventListener("submit", handleEncodeSubmit);
vectorSelectElement.addEventListener("change", (event) => {
	renderVectorPlot(event.target.value);
	renderAllVectorsPlot(event.target.value);
});
loadVocabulary();


