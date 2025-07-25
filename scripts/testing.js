import * as fs from "fs";

const dataURI = "data/OriginalElements.json";
const newDataURI = "data/Elements.json";
const elements = JSON.parse(fs.readFileSync(dataURI).toString());

const fields = [
 "AtomicNumber",
 "Element",
 "Symbol",
 "AtomicMass",
 "NumberOfNeutrons",
 "NumberOfProtons",
 "NumberOfElectrons",
 "Period",
 "Group",
 "Phase",
//  "Radioactive",
//  "Natural",
//  "Metal",
//  "Nonmetal",
//  "Metalloid",
 "Type",
 "AtomicRadius",
 "Electronegativity",
 "ionizationEnergy",
 "Density",
 "MeltingPoint",
 "BoilingPoint",
 "stableIsotopes",
 "Discoverer",
 "Year",
 "SpecificHeat",
 "NumberOfShells",
 "NumberOfValence",
]

const emptyFields = new Map();
for(const element of elements) {
	for(const field of fields) {
		// if(element[field] === "") console.log(`${element["Element"]}, ${field}`);
		if(element[field] === "") {
			const prevVal = emptyFields.get(field) ?? 0;
			emptyFields.set(field, prevVal + 1);
		}
	}
}

for(const [field, count] of emptyFields) {
	console.log(`${field}: ${count}`);
}

const obj = {
	AtomicNumber: "NUMBER",							// 1,2,3,...,118
	AtomicMass: "NUMBER",								// n
	NumberOfNeutrons: "NUMBER",					// n
	NumberOfProtons: "NUMBER",					// 1,2,3,...,118
	NumberOfElectrons: "NUMBER",				// 1,2,3,...,118
	Period: "ENUM",											// 1,2,3,...,7
	Group: "ENUM",											// 1,2,3,...,18,f-block
	Phase: "ENUM",											// Solid, Liquid, Gas, Unknown
	Radioactive: "BOOLEAN",							// True, False
	Natural: "BOOLEAN",									// True, False
	ElementalCategory: "ENUM",					// Metal, Nonmetal, Metalloid
	ChemicalGroup: "ENUM",							// Metalloid, Transtion, Poor,...
	AtomicRadius: "NUMBER",							// n
	Electronegativity: "NUMBER",				// n
	IonizationEnergy: "NUMBER",					// n
	Density: "NUMBER",									// n
	MeltingPoint: "NUMBER",							// n
	BoilingPoint: "NUMBER",							// n
	StableIsotopes: "NUMBER",						// n
	SpecificHeat: "NUMBER",							// n
	NumberOfShells: "NUMBER",						// 1,2,3,...,7
	NumberOfValenceElectrons: "NUMBER"	// 1~8?
}