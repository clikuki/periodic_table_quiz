import * as fs from "fs";

/**
 * ## Original Field names
 * AtomicNumber
 * Element
 * Symbol
 * AtomicMass
 * NumberOfNeutrons
 * NumberOfProtons
 * NumberOfElectrons
 * Period
 * Group
 * Phase
 * Radioactive
 * Natural
 * Metal
 * Nonmetal
 * Metalloid
 * Type
 * AtomicRadius
 * Electronegativity
 * ionizationEnergy
 * Density
 * MeltingPoint
 * BoilingPoint
 * stableIsotopes
 * Discoverer
 * Year
 * SpecificHeat
 * NumberOfShells
 * NumberOfValence
 */

function toBool(str) {
	return str.toLowerCase() === "yes";
}

function thisOr(a, defaultValue) {
	return a === "" ? defaultValue : a;
}

const dataURI = "data/OriginalElements.json";
const newDataURI = "data/Elements.json";
const elements = JSON.parse(fs.readFileSync(dataURI).toString());

const fields = [
	"AtomicNumber",
	"AtomicMass",
	"NumberOfNeutrons",
	"NumberOfProtons",
	"NumberOfElectrons",
	"Period",
	"Group",
	"Phase",
	"Radioactive",
	"Natural",
	"ElementalCategory",
	"ChemicalGroup",
	"AtomicRadius",
	"Electronegativity",
	"IonizationEnergy",
	"Density",
	"MeltingPoint",
	"BoilingPoint",
	"StableIsotopes",
	"SpecificHeat",
	"NumberOfShells",
	"NumberOfValenceElectrons",
];

const fixedElements = elements.map((e) => {
	// Combine metal fields
	const isMetal = toBool(e.Metal);
	const isNonmetal = toBool(e.Nonmetal);
	const isMetalloid = toBool(e.Metalloid);
	const ElementalCategory =
		(isMetal + isNonmetal + isMetalloid != 1 && "N/A") ||
		(isMetal && "Metal") ||
		(isNonmetal && "Nonmetal") ||
		"Metalloid";

	return {
		AtomicNumber: thisOr(e.AtomicNumber, null),
 		Element: e.Element,
 		Symbol: e.Symbol,
		AtomicMass: thisOr(e.AtomicMass, null),
		NumberOfNeutrons: thisOr(e.NumberOfNeutrons, null),
		NumberOfProtons: thisOr(e.NumberOfProtons, null),
		NumberOfElectrons: thisOr(e.NumberOfElectrons, null),
		Period: thisOr(e.Period, null),
		Group: thisOr(e.Group, "f-group"),
		Phase: e.Phase.split(" ")[0],
		Radioactive: toBool(e.Radioactive),
		Natural: toBool(e.Natural),
		ElementalCategory,
		ChemicalGroup: e.Type,
		AtomicRadius: thisOr(e.AtomicRadius, null),
		Electronegativity: thisOr(e.Electronegativity, null),
		IonizationEnergy: thisOr(e.ionizationEnergy, null),
		Density: thisOr(e.Density, null),
		MeltingPoint: thisOr(e.MeltingPoint, null),
		BoilingPoint: thisOr(e.BoilingPoint, null),
		StableIsotopes: thisOr(e.stableIsotopes, null),
		SpecificHeat: thisOr(e.SpecificHeat, null),
		NumberOfShells: thisOr(e.NumberOfShells, null),
		NumberOfValenceElectrons: thisOr(e.NumberOfValence, null),
	};
});

/**
 * || Question Types
 * VALUE - Enter close value
 * OWNER - Enter the element which this value belongs to
 * COMPARE - Given two elements, select the element with a higher value
 * BOOLEAN - Is the property applicatble to this element?
 * # Ideas
 * OUTLIER - find correct element among elements
 * CATEGORY - for fields with limited value set
 * 
 * || Value types
 * # Store in obj { type, <additional data> }
 * String
 * Number (may have unit attached)
 * Boolean
 * Range (min, max)
 * Selection (with values: string[])
 */
const dataTypes = {
	AtomicNumber: {
		type: "NUMBER",
		isUnique: true,
		isComparable: true,
	},
	AtomicMass: {
		type: "NUMBER",
		unit: "u",
		isComparable: true,
	},
	NumberOfNeutrons: {
		type: "NUMBER",
		isComparable: true,
	},
	NumberOfProtons: {
		type: "NUMBER",
		isComparable: true,
	},
	NumberOfElectrons: {
		type: "NUMBER",
		isComparable: true,
	},
	Period: {
		type: "ENUM",
		values: Array(7).fill(1).map((_,i)=>`${i+1}`)
	},
	Group: {
		type: "ENUM",
		values: Array(18).fill(1).map((_,i)=>`${i+1}`).concat("f-block")
	},
	Phase: {
		type: "ENUM",
		values: ["Solid", "Liquid", "Gas", "Unknown"],
	},
	Radioactive: {
		type: "BOOLEAN",
	},
	Natural: {
		type: "BOOLEAN",
	},
	ElementalCategory: {
		type: "ENUM",
		values: ["Metal","Nonmetal","Metalloid"],
	},
	ChemicalGroup: {
		type: "ENUM",
		values: [
			"Non-Metal",
			"Noble Gas",
			"Alkali Metal",
			"Alkaline Earth Metal",
			"Metalloid",
			"Halogen",
			"Post-Transition Metal",
			"Transition Metal",
			"Lanthanide",
			"Actinide",
		],
	},
	AtomicRadius: {
		type: "NUMBER",
		isComparable: true,
	},
	Electronegativity: {
		type: "NUMBER",
		isComparable: true,
	},
	IonizationEnergy: {
		type: "NUMBER",
		unit: "eV",
		isComparable: true,
	},
	Density: {
		type: "NUMBER",
		isComparable: true,
	},
	MeltingPoint: {
		type: "NUMBER",
		unit: "K",
		isComparable: true,
	},
	BoilingPoint: {
		type: "NUMBER",
		unit: "K",
		isComparable: true,
	},
	StableIsotopes: {
		type: "NUMBER",
	},
	SpecificHeat: {
		type: "NUMBER",
		unit: "J/g°C",
		isComparable: true,
	},
	NumberOfShells: {
		type: "NUMBER",
	},
	NumberOfValenceElectrons: {
		type: "NUMBER",
		isComparable: true,
	},
}

const newData = {
	Fields: fields,
	DataTypes: dataTypes,
	Elements: fixedElements,
};

fs.writeFileSync(newDataURI, JSON.stringify(newData));
