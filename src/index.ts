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
const tableElements = table.Elements as PeriodicElement[];

const chemTypeToCSS: Record<string, string> = {
	"Non-Metal": "nonmetal",
	"Noble Gas": "noble",
	"Alkali Metal": "alkali",
	"Alkaline Metal": "alkaline",
	"Metalloid": "metalloid",
	"Halogen": "nonmetal",
	"Poor Metal": "poor",
	"Transition Metal": "transition",
	"Lanthanide": "lanthanoid",
	"Actinide": "actinoid",
}

function randIntInRange(max: number, min = 0): number {
	return Math.floor(Math.random() * (max-min)+min);
}

function getRandomElement(): PeriodicElement {
	return tableElements[randIntInRange(tableElements.length)];
}

function getRandomElements(n: number, field?: string): PeriodicElement[] {
	const elems: PeriodicElement[] = [];
	const values = new Set<string | number>()
	const isBoolean = dataTypes[field ?? ""].type === "BOOLEAN";
	while (elems.length < n) {
		const candidate = getRandomElement();
		if (elems.includes(candidate)) continue;
		if (field !== undefined) {
			if(candidate[field] === null) continue;
			if(!isBoolean && values.has(candidate[field] as string | number)) continue;
		}
		elems.push(candidate);
	}
	return elems;
}

function getRandomField(): string {
	const field = fields[randIntInRange(fields.length)];
	return field;
}

function getRandomAction(
	field: string,
	[score, easyThreshold, normalThreshold]: [number, number, number] = [0, -2, -1]
): Actions | null {
	const dataType = dataTypes[field];
	const actions: Actions[] = [];
	const isNormal = score >= easyThreshold;
	const isHard = score >= normalThreshold;

	if(isNormal && dataType.isUnique) actions.push("OWNER","OWNER","OWNER");
	if(dataType.isComparable && dataType.type !== 'BOOLEAN') {
		if(isNormal) actions.push("COMPARE");
		if(isHard) actions.push("COMPARE");
	}

	switch(dataType.type) {
		case "NUMBER":
			if(isHard) actions.push("OUTLIER", "VALUE");
			break;
		case "BOOLEAN":
			actions.push("BOOLEAN", "OUTLIER");
			if(isHard) actions.push("OUTLIER");
			break;
		case "ENUM":
			if(isNormal) actions.push("OUTLIER");
			if(isHard) actions.push("OUTLIER","CATEGORY");
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

class ElementError extends Error {}

const valuePage = document.querySelector("[data-page=\"VALUE\"]") as HTMLElement;
const ownerPage = document.querySelector("[data-page=\"OWNER\"]") as HTMLElement;
const booleanPage = document.querySelector("[data-page=\"BOOLEAN\"]") as HTMLElement;
const comparePage = document.querySelector("[data-page=\"COMPARE\"]") as HTMLElement;
const categoryPage = document.querySelector("[data-page=\"CATEGORY\"]") as HTMLElement;
const outlierPage = document.querySelector("[data-page=\"OUTLIER\"]") as HTMLElement;
const menuPage = document.querySelector("[data-page=\"MENU\"]") as HTMLElement;
const allPages = [valuePage, ownerPage, comparePage, booleanPage, categoryPage, outlierPage, menuPage]
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

	return new Promise<void>((resolve) => {
		// Page is already open
		if(page.hasAttribute("data-active")) {
			resolve();
			return;
		}

		// If transition event fails to fire for any reason, timer will be used as fallback
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
		page.setAttribute("data-active", "");
	});
}

function isApproxEqual(input: string, value: number): boolean {
	return Math.abs(value - +input) < .5;
}

function moveRandomFromArray<T>(from: T[], dest: T[], maxLength: number) {
	while(dest.length < maxLength && from.length) {
		const last = from.length-1;
		const idx = randIntInRange(from.length);
		[from[idx],from[last]] = [from[last],from[idx]]
		dest.push(from.pop()!);
	}
}

function populateElementData(elementEl: HTMLElement, element: PeriodicElement, field: string) {
	const elementCategory = chemTypeToCSS[element["ChemicalGroup"] as string];
	elementEl.className = `element ${elementCategory}`;
	elementEl.querySelector("[data-symbol]")!.textContent = String(element["Symbol"]);
	
	const dt = dataTypes[field];
	const value = element[field];
	const unit = dt.type === "NUMBER" ? dt.unit ?? "" : "";
	elementEl.querySelector("[data-element-value]")!.textContent = `${value} ${unit}`.trim();;
}

function setTimer(seconds: number) {
	const timerEl = document.querySelector(".timer") as HTMLElement | null;
	if(!timerEl) throw Error("Timer element does not exist!");
	timerEl.removeAttribute("data-hide");
	timerEl.style.setProperty("--percent", "100%")

	const start = Date.now();
	const duration = seconds * 1000;
	const delay = 100; // Delay before ending timer
	return new Promise<void>((resolve)=>{
		requestAnimationFrame(function updateTimer() {
			const now = Date.now();
			if(now > start + duration + delay) {
				timerEl.setAttribute("data-hide", "");
				resolve();
			}
			else {
				requestAnimationFrame(updateTimer);
				const percent = Math.max(100 - 100 * (now - start) / duration, 0);
				timerEl.style.setProperty("--percent", `${percent}%`);
			}
		})
	})
}

function beforeNextPage(correct: boolean) {
	return new Promise<MouseEvent>((resolve) => {
		document.body.setAttribute("data-result", correct ? "CORRECT" : "INCORRECT");
		requestAnimationFrame(() => document.body.addEventListener("click", resolve, { once: true }));
	})
}

function handleValueQuestion(field: string): QuestionHandlerReturnType {		
	const element = getRandomElement();
	const answer = element[field];
	if(typeof answer !== 'number') {
		throw Error(`Invalid ${element}[${field}] datatype`);
	}

	const fieldEl = valuePage.querySelector("[data-field]") as HTMLElement;
	const elementEl = valuePage.querySelector("[data-element]") as HTMLElement;
	const answerEl = valuePage.querySelector("[data-answer]") as HTMLElement;
	const inputEl = valuePage.querySelector("[data-input]") as HTMLInputElement;
	const unit = (dataTypes[field] as NumberType).unit ?? "";

	return {
		value: new Promise<boolean>(async (resolve) => {
			await hideAllPages();

			fieldEl.textContent = splitCapitalCase(field);
			elementEl.textContent = String(element["Element"]);
			answerEl.textContent = `${answer} ${unit}`.trim();
			inputEl.value = "";
			inputEl.focus();
			inputEl.addEventListener("keydown", function inputCB(e: KeyboardEvent) {
				if(e.key !== "Enter") return;
				inputEl.removeEventListener("keydown", inputCB);
				resolve(isApproxEqual(inputEl.value, answer));
			})
			
			revealPage(valuePage);
		}),
		cancel() {
			inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: "Enter" }));
		},
	}
}

function handleOwnerQuestion(field: string): QuestionHandlerReturnType {
	const element = getRandomElement();
	const elementName = (element["Element"] as string).toUpperCase();
	const value = element[field];

	const fieldEl = ownerPage.querySelector("[data-field]") as HTMLElement;
	const valueEl = ownerPage.querySelector("[data-value]") as HTMLElement;
	const answerEl = ownerPage.querySelector("[data-answer]") as HTMLElement;
	const vowelIsNext = ownerPage.querySelector(".vowel-is-next") as HTMLElement;
	const tableEl = ownerPage.querySelector(".table") as HTMLElement;
	const prevAnswerEl = tableEl.querySelector("[data-correct]") as HTMLElement | null;
	const currAnswerEl = tableEl.querySelector(`[data-value="${elementName}"]`) as HTMLElement;

	return {
		value: new Promise<boolean>(async (resolve) => {
			await hideAllPages();
			
			fieldEl.textContent = splitCapitalCase(field);
			valueEl.textContent = String(value);
			answerEl.textContent = elementName;

			if("aeiouAEIOU".includes(field[0])) vowelIsNext.classList.remove("hide")
			else vowelIsNext.classList.add("hide")

			if(prevAnswerEl) prevAnswerEl.removeAttribute("data-correct");

			if(!currAnswerEl) console.error(`No element with name "${elementName}" exists!`)
			else currAnswerEl.setAttribute("data-correct", "")

			function tableClickCB(e: MouseEvent) {
				if(e.target === tableEl) return;
				tableEl.removeEventListener("click", tableClickCB);
				resolve(e.target === currAnswerEl);
			}
			tableEl.addEventListener("click", tableClickCB);

			revealPage(ownerPage)
		}),
		cancel() {
			const incorrectEl = tableEl.querySelector("button:not([data-correct])")!;
			incorrectEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		},
	}
}

function handleCompareQuestion(field: string): QuestionHandlerReturnType {
	const elements = getRandomElements(2, field);
	const goForLower = Math.random() < .5;
	const sign = goForLower ? -1 : 1;

	const questionEl = comparePage.querySelector(".question") as HTMLElement;
	const fieldEl = comparePage.querySelector("[data-field]") as HTMLElement;
	const answerEl = comparePage.querySelector("[data-answer]") as HTMLElement;
	const inputEl = comparePage.querySelector(".input") as HTMLButtonElement; 
	const elementLeftEl = inputEl.querySelector(".input .element[data-left]") as HTMLElement;
	const elementRightEl = inputEl.querySelector(".input .element[data-right]") as HTMLElement;		

	const correctElement = elements.reduce((outlier, element)=> {
		const outValue = outlier[field] as number;
		const curValue = element[field] as number;
		return sign*curValue > sign*outValue ? element : outlier;
	});

	const elementEls = [elementLeftEl, elementRightEl];
	if(Math.random() < .5) [elementEls[0], elementEls[1]] = [elementEls[1], elementEls[0]];

	// Normalize page before use
	elementLeftEl.setAttribute("data-incorrect", "")
	elementRightEl.setAttribute("data-incorrect", "")

	return {
		value: new Promise<boolean>(async (resolve) => {
			await hideAllPages();
			
			fieldEl.textContent = splitCapitalCase(field);
			answerEl.textContent = String(correctElement["Element"]);
			if(goForLower) questionEl.setAttribute("data-comparison", "LOWER")
			else questionEl.setAttribute("data-comparison", "HIGHER")

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
			inputEl.addEventListener("click", clickCB);

			revealPage(comparePage)
		}),
		cancel() {
			const incorrectEl = elementEls.find(el => el.hasAttribute("data-incorrect"))!;
			incorrectEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		},
	}
}

function handleOutlierQuestion(field: string): QuestionHandlerReturnType {
	const dataType = dataTypes[field];
	const elementCount = 6; // dataset shows 6 elems is a reasonable no.
	const elements: PeriodicElement[] = [];
	const findHigherAnswer = Math.random() < .5;
	let correctElement;
	
	const elementTemplate = outlierPage.querySelector("#element") as HTMLTemplateElement;
	const questionEl = outlierPage.querySelector(".question") as HTMLElement;
	const fieldEl = questionEl.querySelector("[data-field]") as HTMLElement;
	const answerEl = outlierPage.querySelector("[data-answer]") as HTMLElement;
	const inputEl = outlierPage.querySelector(".input") as HTMLElement; 

	// IDEA: maybe rewrite to use maxElements rather than element count due to
	// possible bias towards largers groups being the "incorrect" group
	if(dataType.type === 'NUMBER') {
		// Pick a "correct" element, then find either lower or higher
		const sign = findHigherAnswer ? 1 : -1;
		const sorted = (tableElements as Record<string,number>[]).toSorted((a,b)=>sign*a[field]-sign*b[field]);
		const idx = randIntInRange(sorted.length,elementCount);
		correctElement = sorted[idx];
		elements.push(correctElement);
		
		const incorrectElements = sorted.slice(0, idx);
		moveRandomFromArray(incorrectElements, elements, elementCount);
	}
	else {
		const grouped = Object.groupBy(tableElements, (el) => String(el[field]));
		const [correctCategory, ...restCategories] = Object.keys(grouped).sort(() => Math.random() - 0.5);
		const correctGroup = grouped[correctCategory]!;
		correctElement = correctGroup[randIntInRange(correctGroup.length)];
		elements.push(correctElement);

		for(const category of restCategories.sort(()=>Math.random()-0.5)) {
			const group = grouped[category]!;
			if(group.length < elementCount - 1) continue; // too small
			moveRandomFromArray(group, elements, elementCount);
			break;
		}
	}

	// Build HTML
	const elementEls = elements.map((e,i) => {
		const fragment = elementTemplate.content.cloneNode(true) as DocumentFragment;
		const btn = fragment.querySelector('.element') as HTMLButtonElement;

		populateElementData(btn, e, field);
		if(!i) btn.removeAttribute("data-incorrect"); // First element is always the correct one

		return fragment;
	}).sort(() => Math.random() - .5);

	return {
		value: new Promise<boolean>(async (resolve) => {
			await hideAllPages();
			
			fieldEl.textContent = splitCapitalCase(field);
			answerEl.textContent = String(correctElement["Element"]);
			
			let comparisonStr = "DIFFERENT";
			switch(dataType.type) {
				case "NUMBER": comparisonStr = findHigherAnswer ? "HIGHER" : "LOWER"; break;
				case "BOOLEAN": comparisonStr = correctElement[field] ? "POSITIVE" : "NEGATIVE"; break;
			}
			questionEl.setAttribute("data-comparison", comparisonStr);

			function clickCB(e: MouseEvent) {
				const target = e.target as HTMLElement;
				if(target === inputEl) return;
				inputEl.removeEventListener("click", clickCB);
				resolve(!target.hasAttribute("data-incorrect"));
			}
			inputEl.addEventListener("click", clickCB);
			inputEl.replaceChildren(...elementEls);

			revealPage(outlierPage)
		}),
		cancel() {
			const incorrectEl = inputEl.querySelector("[data-incorrect]")!;
			incorrectEl.dispatchEvent(new MouseEvent("click", { bubbles: true }))
		},
	}
}

function handleBooleanQuestion(field: string): QuestionHandlerReturnType {
	const element = getRandomElement();
	const value = element[field] as boolean;

	const fieldEl = booleanPage.querySelector("[data-field]") as HTMLElement;
	const elementEl = booleanPage.querySelector("[data-element]") as HTMLElement;
	const vowelIsNext = booleanPage.querySelector(".vowel-is-next") as HTMLElement;
	const inputEl = booleanPage.querySelector(".input") as HTMLButtonElement; 
	const trueEl = inputEl.querySelector("[data-value=\"TRUE\"]") as HTMLButtonElement;
	const falseEl = inputEl.querySelector("[data-value=\"FALSE\"]") as HTMLButtonElement;
	trueEl.setAttribute("data-incorrect", "");
	falseEl.setAttribute("data-incorrect", "");


	return {
		value: new Promise<boolean>(async (resolve) => {
			await hideAllPages();
			
			fieldEl.textContent = splitCapitalCase(field);
			elementEl.textContent = String(element["Element"]);
			(value ? trueEl : falseEl).removeAttribute("data-incorrect");

			if("aeiouAEIOU".includes(field[0])) vowelIsNext.classList.remove("hide")
			else vowelIsNext.classList.add("hide");
			

			function clickCB(e: MouseEvent) {
				const target = e.target;
				if(target === inputEl) return;
				inputEl.removeEventListener("click", clickCB);
				resolve(value && target === trueEl ||
							!value && target === falseEl);
			}
			inputEl.addEventListener("click", clickCB)

			revealPage(booleanPage)
		}),
		cancel() {
			(value ? falseEl : trueEl).dispatchEvent(new MouseEvent("click", { bubbles: true }));
		},
	}
}

function handleCategoryQuestion(field: string): QuestionHandlerReturnType {
	const dataType = dataTypes[field];
	if(dataType.type !== 'ENUM') {
		throw Error(`"${field}" datatype is not ENUM`);
	}

	const element = getRandomElement();
	const answer = element[field];
	if(typeof answer === 'boolean') {
		throw Error(`Invalid ${element}[${field}] datatype`);
	}

	const values = ["", ...dataType.values];
	const unit = (dataTypes[field] as NumberType).unit ?? "";

	const fieldEl = categoryPage.querySelector("[data-field]") as HTMLElement;
	const elementEl = categoryPage.querySelector("[data-element]") as HTMLElement;
	const answerEl = categoryPage.querySelector("[data-answer]") as HTMLElement;
	const selectEl = categoryPage.querySelector("[data-select]") as HTMLSelectElement;
	const confirmBtn = categoryPage.querySelector("[data-confirm]") as HTMLButtonElement;

	let canceled = false;
	return {
		value: new Promise<boolean>(async (resolve) => {
			await hideAllPages();
			
			fieldEl.textContent = splitCapitalCase(field);
			elementEl.textContent = String(element["Element"]);
			answerEl.textContent = `${answer} ${unit}`.trim();
			selectEl.replaceChildren(...values.map(value => {
				const optionEl = document.createElement("option");
				optionEl.textContent = optionEl.value = String(value);
				return optionEl;
			}));
			selectEl.value = "";
			selectEl.disabled = false;
			
			confirmBtn.addEventListener("click", function selectCB() {
				if(!canceled && selectEl.value === "") return;
				selectEl.disabled = true;
				selectEl.removeEventListener("click", selectCB);
				resolve(selectEl.value === String(answer));
			})
			
			revealPage(categoryPage)
		}),
		cancel() {
			canceled = true;
			confirmBtn.dispatchEvent(new MouseEvent("click"));
		},
	}
}

interface QuestionHandlerReturnType {
	value:Promise<boolean>,
	cancel:()=>void
};
type QuestionHandlerType = (field: string) => QuestionHandlerReturnType;
const questionHandlers: Record<string, QuestionHandlerType | null> = {
	VALUE: handleValueQuestion,
	OWNER: handleOwnerQuestion,
	COMPARE: handleCompareQuestion,
	BOOLEAN: handleBooleanQuestion,
	CATEGORY: handleCategoryQuestion,
	OUTLIER: handleOutlierQuestion,
}

async function handleMenuSwitch(scoreMsg: string) {
	await hideAllPages();
	
	menuPage.setAttribute('data-has-played', "");

	const scoreEl = menuPage.querySelector("[data-score]") as HTMLElement;
	scoreEl.textContent = scoreMsg;
	
	revealPage(menuPage, false);
}

async function startSurvivalMode() {
	let score = 0;

	const easyThreshold = 7;
	const normalThreshold = 20;
	while(true) {
		try {
			const field = getRandomField();
			const action = getRandomAction(field, [score, easyThreshold, normalThreshold]);
			if(!action) continue;

			const questionHandler = questionHandlers[action];
			if(!questionHandler) continue;

			const isCorrect = await questionHandler(field).value;

			await beforeNextPage(isCorrect);

			if(isCorrect) ++score;
			else break;	
		}
		catch(e) {
			// Try another question if element has null field
			if(!(e instanceof ElementError)) throw e;
		}
	}

	handleMenuSwitch(String(score));
}

async function startTimedMode() {
	let score = 0;
	let totalQuestions = 0;
	let keepRunning = true;
	let cancelCurrQuestion = () => {};

	setTimer(60).then(() => {
		keepRunning = false;
		cancelCurrQuestion();
	});

	const easyThreshold = 7;
	const normalThreshold = 20;
	while(keepRunning) {
		try {
			const field = getRandomField();
			const action = getRandomAction(field, [score, easyThreshold, normalThreshold]);
			if(!action) continue;

			const questionHandler = questionHandlers[action];
			if(!questionHandler) continue;

			const res = questionHandler(field);

			cancelCurrQuestion = res.cancel;
			const isCorrect = await res.value;

			// Should I cancel answer page on timer end?
			await beforeNextPage(isCorrect);

			++totalQuestions;
			if(isCorrect) ++score;
		}
		catch(e) {
			// Try another question if element has null field
			if(!(e instanceof ElementError)) throw e;
		}
	}
	
	handleMenuSwitch(`${score}/${totalQuestions}`);
}

function main() {
	// Bind start btns early
	const survivalBtn = menuPage.querySelector("[data-survival]") as HTMLButtonElement;
	const timedBtn = menuPage.querySelector("[data-timed]") as HTMLButtonElement;

	function runAfter(cb: Function) {
		return function() {
			if(!menuPage.hasAttribute("data-active")) return;

			if(document.activeElement instanceof HTMLElement) {
				document.activeElement.blur();
			}

			cb();
		}
	}

	survivalBtn.addEventListener("click", runAfter(startSurvivalMode));
	timedBtn.addEventListener("click", runAfter(startTimedMode));
}

main();