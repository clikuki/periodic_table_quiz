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

function getRandomElements(n: number): PeriodicElement[] {
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
const comparePage = document.querySelector("[data-page=\"BOOLEAN\"]") as HTMLElement;
const booleanPage = document.querySelector("[data-page=\"COMPARE\"]") as HTMLElement;
const timeoutDelay = 610;

function hideAllPages(cb: () => void) {
	for(const page of [valuePage, ownerPage, comparePage, booleanPage]) {
		if(!page.hasAttribute("data-active")) continue;

		// If transtion event fails to fire for any reason, timer will be used as fallback
		const timer = setTimeout(() => {
			page.removeEventListener("transitionend", eventCB);
			cb();
		}, timeoutDelay)
		const eventCB = () => {
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

function revealPage(page: HTMLElement, cb: () => void) {
	if(page.hasAttribute("data-active")) {
		// Page is already open, call by default
		cb();
		return;
	}

	// If transtion event fails to fire for any reason, timer will be used as fallback
	const timer = setTimeout(() => {
		page.removeEventListener("transitionend", eventCB);
		cb();
	}, timeoutDelay)
	const eventCB = () => {
		clearTimeout(timer);
		cb();
	}

	page.addEventListener("transitionend", eventCB, { once: true });
	page.setAttribute("data-active", "");
}

function handleValueQuestion(field: string) {
	hideAllPages(() => {
		const fieldEl = valuePage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const elementEl = valuePage.querySelector("[data-element]") as HTMLElement;
		const element = getRandomElement();
		elementEl.textContent = String(element["Element"]);

		revealPage(valuePage, () => {
			
		})
	})
}
function handleOwnerQuestion(field: string) {
	hideAllPages(() => {
		const fieldEl = ownerPage.querySelector("[data-field]") as HTMLElement;
		fieldEl.textContent = splitCapitalCase(field);

		const valueEl = ownerPage.querySelector("[data-value]") as HTMLElement;
		const element = getRandomElement();
		const value = element[field];
		valueEl.textContent = String(value);

		const vowelIsNext = ownerPage.querySelector(".vowel-is-next") as HTMLElement;
		if("aeiouAEIOU".includes(field[0])) vowelIsNext.classList.remove("hide")
		else vowelIsNext.classList.add("hide")

		revealPage(ownerPage, () => {
			
		})
	})
}
function handleCompareQuestion(field: string) {
	hideAllPages(() => {
		revealPage(comparePage, () => {
			
		})
	})
}
function handleBooleanQuestion(field: string) {
	hideAllPages(() => {
		revealPage(booleanPage, () => {
			
		})
	})
}

function nextQuestion() {
	while(true) {
		const field = getRandomField();
		const action = getRandomAction(field);

		switch(action) {
			case "VALUE":		continue; handleValueQuestion(field); break;
			case "OWNER":		handleOwnerQuestion(field); break;
			case "COMPARE": continue; handleCompareQuestion(field); break;
			case "BOOLEAN": continue; handleBooleanQuestion(field); break;
			default: throw Error(`invalid "${field}" action: ${action}`);
		}

		return;
	}
}

nextQuestion();