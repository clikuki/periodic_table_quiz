export {};

type PeriodicElement = Record<string, string | number | boolean>;
type Actions = "VALUE" | "OWNER" | "COMPARE" | "BOOLEAN" | "OUTLIER" | "CATEGORY";
interface BaseDataType {
	isUnique: boolean;
	isComparable: boolean;
}
interface NumberType extends BaseDataType {
	type: "NUMBER";
	unit?: string;
}
interface BooleanType extends BaseDataType {
	type: "BOOLEAN";
}
interface EnumType extends BaseDataType {
	type: "ENUM";
	values: (number|string)[];
}
type DataType = NumberType | BooleanType | EnumType;

const dataURI = "data/Elements.json";
const table = await fetch(dataURI).then((data) => data.json());

const fields = table.Fields as string[];
const dataTypes = table.DataTypes as Record<string, DataType>;
const elements = table.Elements as PeriodicElement[];

const chemTypeToCSS: Record<string, string> = {
	"Non-Metal": "nonmetal",
	"Noble Gas": "noble",
	"Alkali Metal": "alkali",
	"Alkaline Earth Metal": "alkaline",
	"Metalloid": "metalloid",
	"Halogen": "nonmetal",
	"Post-Transition Metal": "poor",
	"Transition Metal": "transition",
	"Lanthanide": "lanthanoid",
	"Actinide": "actinoid",
}

function randIntInRange(max: number): number {
	return Math.floor(Math.random() * max);
}

function getRandomElement(): PeriodicElement {
	return elements[randIntInRange(elements.length)];
}

function getRandomElements(n: number, diffField?: string): PeriodicElement[] {
	const elems: PeriodicElement[] = [];
	while (elems.length < n) {
		const candidate = getRandomElement();
		if (elems.includes(candidate)) continue;
		if (diffField !== undefined &&
				elems.map(e=>e[diffField]).includes(candidate[diffField])) continue;
		elems.push(candidate);
	}
	return elems;
}

function getRandomField(): string {
	return fields[randIntInRange(fields.length)];
}

function getRandomAction(field: string): Actions | null {
	const dataType = dataTypes[field];
	const actions: Actions[] = ["OUTLIER"];

	if(dataType.isUnique) actions.push("OWNER");
	if(dataType.isComparable && dataType.type !== 'BOOLEAN') actions.push("COMPARE");

	switch(dataType.type) {
		case "NUMBER":
			actions.push("VALUE")
			break;
		case "BOOLEAN":
			actions.push("BOOLEAN")
			break;
		case "ENUM":
			actions.push("CATEGORY")
			break;
	}

	if(!actions.length) return null;
	return actions[Math.floor(Math.random() * actions.length)];
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

const valuePage = document.querySelector("[data-page=\"VALUE\"]") as HTMLElement;
const ownerPage = document.querySelector("[data-page=\"OWNER\"]") as HTMLElement;
const booleanPage = document.querySelector("[data-page=\"BOOLEAN\"]") as HTMLElement;
const comparePage = document.querySelector("[data-page=\"COMPARE\"]") as HTMLElement;
const categoryPage = document.querySelector("[data-page=\"CATEGORY\"]") as HTMLElement;
const menuPage = document.querySelector("[data-page=\"MENU\"]") as HTMLElement;
const allPages = [valuePage, ownerPage, comparePage, booleanPage, categoryPage, menuPage]
const timeoutDelay = 800;

function hideAllPages() {
	return new Promise<void>((resolve) => {
		for(const page of allPages) {
			if(!page.hasAttribute("data-active")) continue;

			// If transtion event fails to fire for any reason, timer will be used as fallback
			const timer = setTimeout(() => {
				page.removeEventListener("transitionend", eventCB);
				resolve();
			}, timeoutDelay)
			const eventCB = (e: TransitionEvent) => {
				if(e.target !== page) return;
				clearTimeout(timer);
				resolve();
			}

			page.addEventListener("transitionend", eventCB, { once: true });
			page.removeAttribute("data-active");
			return
		}

		// No pages are open
		resolve();
	})
} 

function revealPage(page: HTMLElement, revertBackground = true) {
	if(revertBackground) document.body.setAttribute("data-result", "NORMAL");

	// Page is already open
	if(page.hasAttribute("data-active")) return;

	// If transition event fails to fire for any reason, timer will be used as fallback
	const timer = setTimeout(() => {
		page.removeEventListener("transitionend", eventCB);
	}, timeoutDelay)
	const eventCB = (e: TransitionEvent) => {
		if(e.target !== page) return;
		clearTimeout(timer);
	}

	page.addEventListener("transitionend", eventCB, { once: true });
	page.setAttribute("data-active", "");
}

function isApproxEqual(input: string, value: number): boolean {
	return Math.abs(value - +input) < .5;
}

function beforeNextPage(correct: boolean) {
	return new Promise<MouseEvent>((resolve) => {
		document.body.setAttribute("data-result", correct ? "CORRECT" : "INCORRECT")
		requestAnimationFrame(() => document.body.addEventListener("click", resolve, { once: true }))
	})
}

function handleValueQuestion(field: string) {
	return new Promise<boolean>(async (resolve, reject) => {
		await hideAllPages();
		
		const element = getRandomElement();
		const answer = element[field];
		if(typeof answer !== 'number') {
			reject(Error(`Invalid ${element}[${field}] datatype`));
			return
		}

		const fieldEl = valuePage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const elementEl = valuePage.querySelector("[data-element]") as HTMLElement;
		elementEl.textContent = String(element["Element"]);

		const answerEl = valuePage.querySelector("[data-answer]") as HTMLElement;
		const unit = (dataTypes[field] as NumberType).unit ?? "";
		answerEl.textContent = `${answer} ${unit}`.trim();

		const inputEl = valuePage.querySelector("[data-input]") as HTMLInputElement;
		inputEl.value = "";
		inputEl.addEventListener("keydown", function inputCB(e: KeyboardEvent) {
			if(e.key !== "Enter") return;
			inputEl.removeEventListener("keydown", inputCB);
			resolve(isApproxEqual(inputEl.value, answer));
		})
		
		revealPage(valuePage)
	})
}

function handleOwnerQuestion(field: string) {
	return new Promise<boolean>(async (resolve) => {
		await hideAllPages();
		
		const fieldEl = ownerPage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const valueEl = ownerPage.querySelector("[data-value]") as HTMLElement;
		const element = getRandomElement();
		const elementName = (element["Element"] as string).toUpperCase();
		const value = element[field];
		valueEl.textContent = String(value);
		
		const answerEl = ownerPage.querySelector("[data-answer]") as HTMLElement;
		answerEl.textContent = elementName;

		const vowelIsNext = ownerPage.querySelector(".vowel-is-next") as HTMLElement;
		if("aeiouAEIOU".includes(field[0])) vowelIsNext.classList.remove("hide")
		else vowelIsNext.classList.add("hide")

		const tableEl = ownerPage.querySelector(".table") as HTMLElement;
		const prevAnswerEl = tableEl.querySelector("[data-correct]") as HTMLElement | null;
		if(prevAnswerEl) prevAnswerEl.removeAttribute("data-correct");

		const currAnswerEl = tableEl.querySelector(`[data-value="${elementName}"]`) as HTMLElement;
		if(!currAnswerEl) console.error(`No element with name "${elementName}" exists!`)
		else currAnswerEl.setAttribute("data-correct", "")

		function tableClickCB(e: MouseEvent) {
			if(e.target === tableEl) return;
			tableEl.addEventListener("click", tableClickCB);
			resolve(e.target === currAnswerEl);
		}
		tableEl.addEventListener("click", tableClickCB);

		revealPage(ownerPage)
	})
}

function populateElementData(elementEl: HTMLElement, element: PeriodicElement, field: string) {
	const elementCategory = chemTypeToCSS[element["ChemicalGroup"] as string];
	elementEl.className = `element ${elementCategory}`;
	elementEl.querySelector("[data-symbol]")!.textContent = String(element["Symbol"]);
	elementEl.querySelector("[data-element-value]")!.textContent = String(element[field]);
}
function handleCompareQuestion(field: string) {
	// Normalize page before use
	const inputEl = comparePage.querySelector(".input") as HTMLButtonElement; 
	const elementLeftEl = inputEl.querySelector(".input .element[data-left]") as HTMLElement;
	const elementRightEl = inputEl.querySelector(".input .element[data-right]") as HTMLElement;		
	elementLeftEl.setAttribute("data-incorrect", "")
	elementRightEl.setAttribute("data-incorrect", "")

	return new Promise<boolean>(async (resolve) => {
		await hideAllPages();
		
		const questionEl = comparePage.querySelector(".question") as HTMLElement;
		const goForLower = Math.random() < .5;
		if(goForLower) questionEl.setAttribute("data-comparison", "LOWER")
		else questionEl.setAttribute("data-comparison", "HIGHER")

		const fieldEl = comparePage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const answerEl = comparePage.querySelector("[data-answer]") as HTMLElement;
		const elements = getRandomElements(2, field);

		const sign = goForLower ? -1 : 1;
		const correctElement = elements.reduce((outlier, element)=> {
			const outValue = outlier[field] as number;
			const curValue = element[field] as number;
			return sign*curValue > sign*outValue ? element : outlier;
		});
		answerEl.textContent = String(correctElement["Element"]);

		const elementEls = [elementLeftEl, elementRightEl];
		if(Math.random() < .5) [elementEls[0], elementEls[1]] = [elementEls[1], elementEls[0]];
		for(let i = 0; i < 2; ++i) {
			populateElementData(elementEls[i], elements[i], field);
			if(correctElement === elements[i]) {
				elementEls[i].removeAttribute("data-incorrect");
			}
		}

		function clickCB(e: MouseEvent) {
			const target = e.target as HTMLElement;
			if(target === inputEl) return;
			inputEl.removeEventListener("click", clickCB);
			resolve(!target.hasAttribute("data-incorrect"));
		}
		inputEl.addEventListener("click", clickCB)

		revealPage(comparePage)
	})
}

function handleBooleanQuestion(field: string) {
	const inputEl = booleanPage.querySelector(".input") as HTMLButtonElement; 
	const trueEl = inputEl.querySelector("[data-value=\"TRUE\"]") as HTMLButtonElement;
	const falseEl = inputEl.querySelector("[data-value=\"FALSE\"]") as HTMLButtonElement;
	trueEl.setAttribute("data-incorrect", "");
	falseEl.setAttribute("data-incorrect", "");

	return new Promise<boolean>(async (resolve) => {
		await hideAllPages();
		
		const fieldEl = booleanPage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const elementEl = booleanPage.querySelector("[data-element]") as HTMLElement;
		const element = getRandomElement();
		elementEl.textContent = String(element["Element"]);
		
		const vowelIsNext = booleanPage.querySelector(".vowel-is-next") as HTMLElement;
		if("aeiouAEIOU".includes(field[0])) vowelIsNext.classList.remove("hide")
		else vowelIsNext.classList.add("hide")
		
		const value = element[field] as boolean;
		(value ? trueEl : falseEl).removeAttribute("data-incorrect");

		function clickCB(e: MouseEvent) {
			const target = e.target;
			if(target === inputEl) return;
			inputEl.removeEventListener("click", clickCB);
			resolve(value && target === trueEl ||
						!value && target === falseEl);
		}
		inputEl.addEventListener("click", clickCB)

		revealPage(booleanPage)
	})
}

function handleCategoryQuestion(field: string) {
	return new Promise<boolean>(async (resolve, reject) => {
		await hideAllPages();
		
		const dataType = dataTypes[field];
		if(dataType.type !== 'ENUM') {
			reject(Error(`"${field}" datatype is not ENUM`));
			return
		}
		const element = getRandomElement();
		const answer = element[field];
		if(typeof answer === 'boolean') {
			reject(Error(`Invalid ${element}[${field}] datatype`));
			return
		}

		const fieldEl = categoryPage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const elementEl = categoryPage.querySelector("[data-element]") as HTMLElement;
		elementEl.textContent = String(element["Element"]);

		const answerEl = categoryPage.querySelector("[data-answer]") as HTMLElement;
		const unit = (dataTypes[field] as NumberType).unit ?? "";
		answerEl.textContent = `${answer} ${unit}`.trim();

		const selectEl = categoryPage.querySelector("[data-select]") as HTMLSelectElement;
		const values = ["", ...dataType.values];
		selectEl.replaceChildren(...values.map(value => {
			const optionEl = document.createElement("option");
			optionEl.textContent = optionEl.value = String(value);
			return optionEl;
		}));
		selectEl.value = "";
		selectEl.disabled = false;
		

		const confirmBtn = categoryPage.querySelector("[data-confirm]") as HTMLButtonElement;
		confirmBtn.addEventListener("click", function selectCB() {
			if(selectEl.value === "") return;
			selectEl.disabled = true;
			selectEl.removeEventListener("click", selectCB);
			resolve(selectEl.value === String(answer));
		})
		
		revealPage(categoryPage)
	})
}

async function handleMenuSwitch(score: number) {
	await hideAllPages();
	
	menuPage.setAttribute('data-has-played', "");

	const scoreEl = menuPage.querySelector("[data-score]") as HTMLElement;
	scoreEl.textContent = String(score);
	
	revealPage(menuPage, false);
}

async function nextQuestion() {
	let score = 0;

	while(true) {
		const field = getRandomField();
		const action = getRandomAction(field);
		
		let isCorrect: boolean | null = null; // can be null for debugging purposes
		switch(action) {
			case "VALUE":			isCorrect = await handleValueQuestion(field); break;
			case "OWNER":			isCorrect = await handleOwnerQuestion(field); break;
			case "COMPARE":		isCorrect = await handleCompareQuestion(field); break;
			case "BOOLEAN":		isCorrect = await handleBooleanQuestion(field); break;
			case "CATEGORY":	isCorrect = await handleCategoryQuestion(field); break;
			case "OUTLIER":		break; // TODO: implement OUTLIER questions
		}

		if(isCorrect === null) continue;
		await beforeNextPage(isCorrect);

		if(isCorrect) ++score;
		else break;
	}

	handleMenuSwitch(score);
}

function main() {
	// Bind start btn early
	const startBtn = menuPage.querySelector(".start") as HTMLButtonElement;
	startBtn.addEventListener("click", nextQuestion);
}

main();