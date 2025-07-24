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