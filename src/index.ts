export {};

const dataURI = "data/Elements.json";
const table = await fetch(dataURI).then((data) => data.json());

type PeriodicElement = Record<string, string | number>;
const fields = table.Fields as string[];
const elements = table.Elements as PeriodicElement[];

function randIntInRange(max: number) {
	return Math.floor(Math.random() * max);
}

function getRandomElement(): PeriodicElement {
	return elements[randIntInRange(elements.length)];
}

function getRandomElements(n = 1): PeriodicElement[] {
	const elems: PeriodicElement[] = [];
	while (elems.length < n) {
		const candidate = getRandomElement();
		if (!elems.includes(candidate)) elems.push(candidate);
	}
	return elems;
}

function getRandomField() {
	return fields[randIntInRange(fields.length)];
}

function splitCapitalCase(str: string) {
	if (!str.length) return "";

	let newStr = str[0];
	for (let i = 1; i < str.length; ++i) {
		const char = str[i];
		if (char.toLowerCase() !== char) newStr += " ";
		newStr += char;
	}

	return newStr;
}

function main() {
	const [elementA, elementB] = getRandomElements(2);
	const field = getRandomField();
	console.table({
		[elementA.Element]: { [field]: elementA[field] },
		[elementB.Element]: { [field]: elementB[field] },
	});
}

main();
