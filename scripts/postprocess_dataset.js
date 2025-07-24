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
		AtomicNumber: +e.AtomicNumber,
 		Element: e.Element,
 		Symbol: e.Symbol,
		AtomicMass: `${+e.AtomicMass} u`,
		NumberOfNeutrons: +e.NumberOfNeutrons,
		NumberOfProtons: +e.NumberOfProtons,
		NumberOfElectrons: +e.NumberOfElectrons,
		Period: +e.Period,
		Group: thisOr(e.Group, "f-group"),
		Phase: e.Phase.split(" ")[0],
		Radioactive: toBool(e.Radioactive),
		Natural: toBool(e.Natural),
		ElementalCategory,
		ChemicalGroup: e.Type,
		AtomicRadius: +e.AtomicRadius,
		Electronegativity: +e.Electronegativity,
		IonizationEnergy: `${+e.ionizationEnergy} eV`,
		Density: +e.Density,
		MeltingPoint: `${+e.MeltingPoint} K`,
		BoilingPoint: `${+e.BoilingPoint} K`,
		StableIsotopes: +e.stableIsotopes,
		SpecificHeat: `${+e.SpecificHeat} J/g°C`,
		NumberOfShells: +e.NumberOfShells,
		NumberOfValenceElectrons: +e.NumberOfValence,
		// Discoverer: thisOr(e.Discoverer, "N/A"),
		// Year: thisOr(e.Year, "N/A"),
	};
});

/**
 * # Question Types
 * VALUE - Enter close value
 * OWNER - Enter the element which this value belongs to
 * COMPARE - Given two elements, select the element with a higher value
 * BOOLEAN - Is the property applicatble to this element?
 *
 * # Ideas
 * MATCH - match a value to 2 or more elements
 * CATEGORY - for fields with limited value set
 */
const actions = {
	AtomicNumber: ["VALUE", "OWNER", "COMPARE"],
	AtomicMass: ["COMPARE"],
	NumberOfNeutrons: ["VALUE", "COMPARE"],
	NumberOfProtons: ["VALUE", "COMPARE"],
	NumberOfElectrons: ["VALUE", "COMPARE"],
	Period: ["VALUE"],
	Group: ["VALUE"],
	Phase: ["VALUE"],
	Radioactive: ["BOOLEAN"],
	Natural: ["BOOLEAN"],
	ElementalCategory: ["VALUE"],
	ChemicalGroup: ["VALUE"],
	AtomicRadius: ["COMPARE"],
	Electronegativity: ["COMPARE"],
	IonizationEnergy: ["COMPARE"],
	Density: ["COMPARE"],
	MeltingPoint: ["COMPARE"],
	BoilingPoint: ["COMPARE"],
	StableIsotopes: ["COMPARE"],
	SpecificHeat: ["COMPARE"],
	NumberOfShells: ["COMPARE"],
	NumberOfValenceElectrons: ["COMPARE"],
};

const newData = {
	Fields: fields,
	Actions: actions,
	Elements: fixedElements,
};

fs.writeFileSync(newDataURI, JSON.stringify(newData));
