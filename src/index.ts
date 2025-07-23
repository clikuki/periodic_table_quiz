export {};

const dataURI = "data/Elements.json";
const table = await fetch(dataURI).then((data) => data.json());

type PeriodicElement = Record<string, string | number | boolean>;
const fields = table.Fields as string[];
const allActions = table.Actions as Record<string, string[]>;
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

type Actions = "VALUE" | "OWNER" | "COMPARE" | "BOOLEAN";
function getRandomAction(field: string): Actions | null {
	const actions = allActions[field];
	return actions?.[randIntInRange(actions.length)] as Actions ?? null;
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
const timeoutDelay = 800;

function hideAllPages(cb: () => void) {
	for(const page of [valuePage, ownerPage, comparePage, booleanPage]) {
		if(!page.hasAttribute("data-active")) continue;

		// If transtion event fails to fire for any reason, timer will be used as fallback
		const timer = setTimeout(() => {
			page.removeEventListener("transitionend", eventCB);
			cb();
		}, timeoutDelay)
		const eventCB = (e: TransitionEvent) => {
			if(e.target !== page) return;
			clearTimeout(timer);
			cb();
		}

		page.addEventListener("transitionend", eventCB, { once: true });
		page.removeAttribute("data-active");
		return
	}

	// None are open, call by default
	cb();
} 

function revealPage(page: HTMLElement) {
	// Page is already open, call by default
	if(page.hasAttribute("data-active")) return;

	// If transtion event fails to fire for any reason, timer will be used as fallback
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

function isApproxEqual(input: string, value: string | number): boolean {
	if(typeof value === 'string') {
		// IDEA: Maybe add levenshetein distance checker to allow almost correct answers (typos)
		return input.toLowerCase() === value.toLowerCase();
	}
	else {
		return Math.abs(value - +input) < .5;
	}
}

function performAnswerChanges(correct: boolean, cb?: () => void) {
	if(correct) {
		document.body.setAttribute("data-result", "CORRECT")
	}
	else {
		document.body.setAttribute("data-result", "INCORRECT")
	}

	requestAnimationFrame(() => document.body.addEventListener("click", () => {
		cb?.();
		nextQuestion();
	}, { once: true }))
}

function handleValueQuestion(field: string) {
	hideAllPages(() => {
		document.body.setAttribute("data-result", "NORMAL");
		
		const element = getRandomElement();
		const answer = element[field];
		if(typeof answer === 'boolean') throw Error(`"${field}" value of element "${element["Element"]}" is boolean`);

		const fieldEl = valuePage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const elementEl = valuePage.querySelector("[data-element]") as HTMLElement;
		elementEl.textContent = String(element["Element"]);

		const answerEl = valuePage.querySelector("[data-answer]") as HTMLElement;
		answerEl.textContent = String(answer);

		const inputEl = valuePage.querySelector("[data-input]") as HTMLInputElement;
		inputEl.value = "";
		inputEl.addEventListener("keydown", function inputCB(e: KeyboardEvent) {
			if(e.key !== "Enter") return;
			inputEl.removeEventListener("keydown", inputCB);
			performAnswerChanges(isApproxEqual(inputEl.value, answer as string | number));
		})
		
		revealPage(valuePage)
	})
}

function handleOwnerQuestion(field: string) {
	hideAllPages(() => {
		document.body.setAttribute("data-result", "NORMAL");
		
		const fieldEl = ownerPage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const valueEl = ownerPage.querySelector("[data-value]") as HTMLElement;
		const element = getRandomElement();
		const elementName = (element["Element"] as string).toUpperCase();
		const value = element[field];
		valueEl.textContent = String(value);

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
			performAnswerChanges(e.target === currAnswerEl);
		}
		tableEl.addEventListener("click", tableClickCB);

		revealPage(ownerPage)
	})
}

function handleCompareQuestion(field: string) {
	hideAllPages(() => {
		document.body.setAttribute("data-result", "NORMAL");
		
		const questionEl = comparePage.querySelector(".question") as HTMLElement;
		const goForLower = Math.random() < .5;
		if(goForLower) questionEl.setAttribute("data-comparison", "LOWER")
		else questionEl.setAttribute("data-comparison", "HIGHER")

		const fieldEl = comparePage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const [elementLeft, elementRight] = getRandomElements(2, field);
		const answerEl = comparePage.querySelector("[data-answer]") as HTMLElement;
		const lower = elementLeft[field] < elementRight[field] ? elementLeft : elementRight;
		const higher = elementLeft[field] > elementRight[field] ? elementLeft : elementRight;
		answerEl.textContent = String((goForLower ? lower : higher)["Element"]);

		const inputEl = comparePage.querySelector(".input") as HTMLButtonElement; 
		const elementLeftEl = inputEl.querySelector(".input .element[data-left]") as HTMLElement;
		const elementRightEl = inputEl.querySelector(".input .element[data-right]") as HTMLElement;		
		const elementLeftCategory = chemTypeToCSS[elementLeft["ChemicalGroup"] as string];
		const elementRightCategory = chemTypeToCSS[elementRight["ChemicalGroup"] as string];
		elementLeftEl.className = `element ${elementLeftCategory}`;
		elementRightEl.className = `element ${elementRightCategory}`;
		elementLeftEl.querySelector("[data-symbol]")!.textContent = String(elementLeft["Symbol"]);
		elementRightEl.querySelector("[data-symbol]")!.textContent = String(elementRight["Symbol"]);
		elementLeftEl.querySelector("[data-element-value]")!.textContent = String(elementLeft[field]);
		elementRightEl.querySelector("[data-element-value]")!.textContent = String(elementRight[field]);

		const leftIsCorrect = goForLower && lower === elementLeft || !goForLower && higher === elementLeft;
		if(leftIsCorrect) elementLeftEl.removeAttribute("data-incorrect");
		else elementRightEl.removeAttribute("data-incorrect");

		function clickCB(e: MouseEvent) {
			const target = e.target as HTMLElement;
			if(target === inputEl) return;
			inputEl.removeEventListener("click", clickCB);
			performAnswerChanges(!target.hasAttribute("data-incorrect"), () => {
				elementLeftEl.setAttribute("data-incorrect", "")
				elementRightEl.setAttribute("data-incorrect", "")
			});
		}
		inputEl.addEventListener("click", clickCB)

		revealPage(comparePage)
	})
}

function handleBooleanQuestion(field: string) {
	hideAllPages(() => {
		document.body.setAttribute("data-result", "NORMAL");
		
		const fieldEl = booleanPage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const elementEl = booleanPage.querySelector("[data-element]") as HTMLElement;
		const element = getRandomElement();
		elementEl.textContent = String(element["Element"]);
		
		const vowelIsNext = booleanPage.querySelector(".vowel-is-next") as HTMLElement;
		if("aeiouAEIOU".includes(field[0])) vowelIsNext.classList.remove("hide")
		else vowelIsNext.classList.add("hide")
		
		const value = element[field] as boolean;
		const inputEl = booleanPage.querySelector(".input") as HTMLButtonElement; 
		const trueEl = inputEl.querySelector("[data-value=\"TRUE\"]") as HTMLButtonElement;
		const falseEl = inputEl.querySelector("[data-value=\"FALSE\"]") as HTMLButtonElement;
		if(value) {
			trueEl.removeAttribute("data-incorrect");
			falseEl.setAttribute("data-incorrect", "");
		} else {
			falseEl.removeAttribute("data-incorrect");
			trueEl.setAttribute("data-incorrect", "");
		}

		function clickCB(e: MouseEvent) {
			const target = e.target;
			if(target === inputEl) return;
			inputEl.removeEventListener("click", clickCB);
			performAnswerChanges(value && target === trueEl ||
													!value && target === falseEl);
		}
		inputEl.addEventListener("click", clickCB)

		revealPage(booleanPage)
	})
}

function nextQuestion() {
	while(true) {
		const field = getRandomField();
		const action = getRandomAction(field);
		
		switch(action) {//continue; 
			case "VALUE":		handleValueQuestion(field); break;
			case "OWNER":		handleOwnerQuestion(field); break;
			case "COMPARE": handleCompareQuestion(field); break;
			case "BOOLEAN": handleBooleanQuestion(field); break;
			default: throw Error(`invalid "${field}" action: ${action}`);
		}

		return;
	}
}

nextQuestion();