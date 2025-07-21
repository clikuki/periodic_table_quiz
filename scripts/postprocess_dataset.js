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
	"Element",
	"Symbol",
	"AtomicMass",
	"NumberOfNeutrons",
	"NumberOfProtons",
	"NumberOfElectrons",
	"Period",
	"Group",
	"Phase",
	"Radioactive",
	"Natural",
	"ElementCategory",
	"ChemicalGroup",
	"AtomicRadius",
	"Electronegativity",
	"ionizationEnergy",
	"Density",
	"MeltingPoint",
	"BoilingPoint",
	"stableIsotopes",
	"SpecificHeat",
	"NumberOfShells",
	"NumberOfValence",
];

const fixedElements = elements.map((e) => {
	// Combine metal fields
	const isMetal = toBool(e.Metal);
	const isNonmetal = toBool(e.Nonmetal);
	const isMetalloid = toBool(e.Metalloid);
	const ElementCategory =
		(isMetal + isNonmetal + isMetalloid != 1 && "N/A") ||
		(isMetal && "Metal") ||
		(isNonmetal && "Nonmetal") ||
		"Metalloid";

	return {
		AtomicNumber: +e.AtomicNumber,
		Element: e.Element,
		Symbol: e.Symbol,
		AtomicMass: +e.AtomicMass,
		NumberOfNeutrons: +e.NumberOfNeutrons,
		NumberOfProtons: +e.NumberOfProtons,
		NumberOfElectrons: +e.NumberOfElectrons,
		Period: +e.Period,
		Group: thisOr(e.Group, "f-group"),
		Phase: e.Phase,
		Radioactive: toBool(e.Radioactive),
		Natural: toBool(e.Natural),
		ElementCategory,
		ChemicalGroup: e.Type,
		AtomicRadius: +e.AtomicRadius,
		Electronegativity: +e.Electronegativity,
		ionizationEnergy: +e.ionizationEnergy,
		Density: +e.Density,
		MeltingPoint: +e.MeltingPoint,
		BoilingPoint: +e.BoilingPoint,
		stableIsotopes: +e.stableIsotopes,
		// Discoverer: thisOr(e.Discoverer, "N/A"),
		// Year: thisOr(e.Year, "N/A"),
		SpecificHeat: +e.SpecificHeat,
		NumberOfShells: +e.NumberOfShells,
		NumberOfValence: +e.NumberOfValence,
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
	Element: ["VALUE", "OWNER"],
	Symbol: ["VALUE", "OWNER"],
	AtomicMass: ["VALUE", "COMPARE"],
	NumberOfNeutrons: ["VALUE", "COMPARE"],
	NumberOfProtons: ["VALUE", "COMPARE"],
	NumberOfElectrons: ["VALUE", "COMPARE"],
	Period: ["VALUE"],
	Group: ["VALUE"],
	Phase: ["VALUE"],
	Radioactive: ["BOOLEAN"],
	Natural: ["BOOLEAN"],
	ElementCategory: ["VALUE"],
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
	NumberOfValence: ["COMPARE"],
};

const newData = {
	Fields: fields,
	Actions: actions,
	Elements: fixedElements,
};

fs.writeFileSync(newDataURI, JSON.stringify(newData));
