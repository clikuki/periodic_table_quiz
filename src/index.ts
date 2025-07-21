export {};

const dataURI = "data/Elements.json";
const table = await fetch(dataURI).then((data) => data.json());

type PeriodicElement = Record<string, string | number>;
const fields = table.Fields as string[];
const allActions = table.Actions as Record<string, string[]>;
const elements = table.Elements as PeriodicElement[];

function randIntInRange(max: number): number {
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

function getRandomField(): string {
	return fields[randIntInRange(fields.length)];
}

function getRandomAction(field: string): string | null {
	const actions = allActions[field];
	return actions?.[randIntInRange(actions.length)] ?? null;
}

function splitCapitalCase(str: string): string {
	if (!str.length) return "";

	let newStr = str[0];
	for (let i = 1; i < str.length; ++i) {
		const char = str[i];
		if (char.toLowerCase() !== char) newStr += " ";
		newStr += char;
	}

	return newStr;
}

// VALUE, OWNER, COMPARE, BOOLEAN
function main() {
	const field = getRandomField();
	const action = getRandomAction(field);
}

main();
