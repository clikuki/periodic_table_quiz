import * as fs from "fs";

// const dataURI = "data/OriginalElements.json";
const dataURI = "data/Elements.json";
const table = JSON.parse(fs.readFileSync(dataURI).toString());

const fields = table.Fields;
const dataTypes = table.DataTypes;
const tableElements = table.Elements;

const maxElements = 6;
const sign = Math.random() < .5 ? 1 : -1;
const elements = [];

function randIntInRange(max) {
	return Math.floor(Math.random() * max);
}
function getRandomElement() {
	return tableElements[randIntInRange(tableElements.length)];
}
function getRandomField() {
	while(true) {
		const field = fields[randIntInRange(fields.length)];
		if(field === "ChemicalGroup") return field;
	}
}

// function categorizeNonNumberFields() {
// 	for(const field of fields) {
// 		if(dataTypes[field].type === "NUMBER") continue;
// 		console.log(`\n${field}============`)
	
// 		const grouped = Object.groupBy(tableElements, (el) => String(el[field]));
// 		for(const [category, elements] of Object.entries(grouped)) {
// 			console.log(category, elements.length);
// 		}
// 	}
// }

// function countEmptyFields() {
// 	const emptyFields = new Map();
// 	for(const element of elements) {
// 		for(const field of fields) {
// 			// if(element[field] === "") console.log(`${element["Element"]}, ${field}`);
// 			if(element[field] === "") {
// 				const prevVal = emptyFields.get(field) ?? 0;
// 				emptyFields.set(field, prevVal + 1);
// 			}
// 		}
// 	}

// 	for(const [field, count] of emptyFields) {
// 		console.log(`${field}: ${count}`);
// 	}
// }

// {
// 	AtomicNumber: "NUMBER",							// 1,2,3,...,118
// 	AtomicMass: "NUMBER",								// n
// 	NumberOfNeutrons: "NUMBER",					// n
// 	NumberOfProtons: "NUMBER",					// 1,2,3,...,118
// 	NumberOfElectrons: "NUMBER",				// 1,2,3,...,118
// 	Period: "ENUM",											// 1,2,3,...,7
// 	Group: "ENUM",											// 1,2,3,...,18,f-block
// 	Phase: "ENUM",											// Solid, Liquid, Gas, Unknown
// 	Radioactive: "BOOLEAN",							// True, False
// 	Natural: "BOOLEAN",									// True, False
// 	ElementalCategory: "ENUM",					// Metal, Nonmetal, Metalloid
// 	ChemicalGroup: "ENUM",							// Metalloid, Transtion, Poor,...
// 	AtomicRadius: "NUMBER",							// n
// 	Electronegativity: "NUMBER",				// n
// 	IonizationEnergy: "NUMBER",					// n
// 	Density: "NUMBER",									// n
// 	MeltingPoint: "NUMBER",							// n
// 	BoilingPoint: "NUMBER",							// n
// 	NumberOfStableIsotopes: "NUMBER",						// n
// 	SpecificHeat: "NUMBER",							// n
// 	NumberOfShells: "NUMBER",						// 1,2,3,...,7
// 	NumberOfValenceElectrons: "NUMBER"	// 1~8?
// }