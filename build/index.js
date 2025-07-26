const dataURI = "data/Elements.json";
const table = await fetch(dataURI).then((data) => data.json());
const fields = table.Fields;
const dataTypes = table.DataTypes;
const tableElements = table.Elements;
const chemTypeToCSS = {
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
};
function randIntInRange(max, min = 0) {
    return Math.floor(Math.random() * (max - min) + min);
}
function getRandomElement() {
    return tableElements[randIntInRange(tableElements.length)];
}
function getRandomElements(n, field) {
    const elems = [];
    const values = new Set();
    const isBoolean = dataTypes[field ?? ""].type === "BOOLEAN";
    while (elems.length < n) {
        const candidate = getRandomElement();
        if (elems.includes(candidate))
            continue;
        if (field !== undefined) {
            if (candidate[field] === null)
                continue;
            if (!isBoolean && values.has(candidate[field]))
                continue;
        }
        elems.push(candidate);
    }
    return elems;
}
function getRandomField() {
    const field = fields[randIntInRange(fields.length)];
    return field;
}
function getRandomAction(field) {
    const dataType = dataTypes[field];
    const actions = [];
    if (dataType.isUnique)
        actions.push("OWNER");
    if (dataType.isComparable && dataType.type !== 'BOOLEAN')
        actions.push("COMPARE");
    switch (dataType.type) {
        case "NUMBER":
            actions.push("VALUE");
            if (dataType.isComparable)
                actions.push("OUTLIER");
            break;
        case "BOOLEAN":
            actions.push("BOOLEAN", "OUTLIER");
            break;
        case "ENUM":
            actions.push("CATEGORY", "OUTLIER");
            break;
    }
    if (!actions.length)
        return null;
    return actions[Math.floor(Math.random() * actions.length)];
}
function splitCapitalCase(str) {
    if (!str.length)
        return "";
    let newStr = str[0];
    for (let i = 1; i < str.length; ++i) {
        const char = str[i];
        if (char.toLowerCase() !== char)
            newStr += " ";
        newStr += char;
    }
    return newStr;
}
const valuePage = document.querySelector("[data-page=\"VALUE\"]");
const ownerPage = document.querySelector("[data-page=\"OWNER\"]");
const booleanPage = document.querySelector("[data-page=\"BOOLEAN\"]");
const comparePage = document.querySelector("[data-page=\"COMPARE\"]");
const categoryPage = document.querySelector("[data-page=\"CATEGORY\"]");
const outlierPage = document.querySelector("[data-page=\"OUTLIER\"]");
const menuPage = document.querySelector("[data-page=\"MENU\"]");
const allPages = [valuePage, ownerPage, comparePage, booleanPage, categoryPage, outlierPage, menuPage];
const timeoutDelay = 800;
function hideAllPages() {
    return new Promise((resolve) => {
        for (const page of allPages) {
            if (!page.hasAttribute("data-active"))
                continue;
            // If transtion event fails to fire for any reason, timer will be used as fallback
            const timer = setTimeout(() => {
                page.removeEventListener("transitionend", eventCB);
                resolve();
            }, timeoutDelay);
            const eventCB = (e) => {
                if (e.target !== page)
                    return;
                clearTimeout(timer);
                resolve();
            };
            page.addEventListener("transitionend", eventCB, { once: true });
            page.removeAttribute("data-active");
            return;
        }
        // No pages are open
        resolve();
    });
}
function revealPage(page, revertBackground = true) {
    if (revertBackground)
        document.body.setAttribute("data-result", "NORMAL");
    // Page is already open
    if (page.hasAttribute("data-active"))
        return;
    // If transition event fails to fire for any reason, timer will be used as fallback
    const timer = setTimeout(() => {
        page.removeEventListener("transitionend", eventCB);
    }, timeoutDelay);
    const eventCB = (e) => {
        if (e.target !== page)
            return;
        clearTimeout(timer);
    };
    page.addEventListener("transitionend", eventCB, { once: true });
    page.setAttribute("data-active", "");
}
function isApproxEqual(input, value) {
    return Math.abs(value - +input) < .5;
}
function moveRandomFromArray(from, dest, maxLength) {
    while (dest.length < maxLength && from.length) {
        const last = from.length - 1;
        const idx = randIntInRange(from.length);
        [from[idx], from[last]] = [from[last], from[idx]];
        dest.push(from.pop());
    }
}
function populateElementData(elementEl, element, field) {
    const elementCategory = chemTypeToCSS[element["ChemicalGroup"]];
    elementEl.className = `element ${elementCategory}`;
    elementEl.querySelector("[data-symbol]").textContent = String(element["Symbol"]);
    const dt = dataTypes[field];
    const value = element[field];
    const unit = dt.type === "NUMBER" ? dt.unit ?? "" : "";
    elementEl.querySelector("[data-element-value]").textContent = `${value} ${unit}`.trim();
    ;
}
function beforeNextPage(correct) {
    return new Promise((resolve) => {
        document.body.setAttribute("data-result", correct ? "CORRECT" : "INCORRECT");
        requestAnimationFrame(() => document.body.addEventListener("click", resolve, { once: true }));
    });
}
function handleValueQuestion(field) {
    return new Promise(async (resolve, reject) => {
        await hideAllPages();
        const element = getRandomElement();
        const answer = element[field];
        if (typeof answer !== 'number') {
            reject(Error(`Invalid ${element}[${field}] datatype`));
            return;
        }
        const fieldEl = valuePage.querySelector("[data-field]");
        fieldEl.textContent = splitCapitalCase(field);
        const elementEl = valuePage.querySelector("[data-element]");
        elementEl.textContent = String(element["Element"]);
        const answerEl = valuePage.querySelector("[data-answer]");
        const unit = dataTypes[field].unit ?? "";
        answerEl.textContent = `${answer} ${unit}`.trim();
        const inputEl = valuePage.querySelector("[data-input]");
        inputEl.value = "";
        inputEl.addEventListener("keydown", function inputCB(e) {
            if (e.key !== "Enter")
                return;
            inputEl.removeEventListener("keydown", inputCB);
            resolve(isApproxEqual(inputEl.value, answer));
        });
        revealPage(valuePage);
    });
}
function handleOwnerQuestion(field) {
    return new Promise(async (resolve) => {
        await hideAllPages();
        const fieldEl = ownerPage.querySelector("[data-field]");
        fieldEl.textContent = splitCapitalCase(field);
        const valueEl = ownerPage.querySelector("[data-value]");
        const element = getRandomElement();
        const elementName = element["Element"].toUpperCase();
        const value = element[field];
        valueEl.textContent = String(value);
        const answerEl = ownerPage.querySelector("[data-answer]");
        answerEl.textContent = elementName;
        const vowelIsNext = ownerPage.querySelector(".vowel-is-next");
        if ("aeiouAEIOU".includes(field[0]))
            vowelIsNext.classList.remove("hide");
        else
            vowelIsNext.classList.add("hide");
        const tableEl = ownerPage.querySelector(".table");
        const prevAnswerEl = tableEl.querySelector("[data-correct]");
        if (prevAnswerEl)
            prevAnswerEl.removeAttribute("data-correct");
        const currAnswerEl = tableEl.querySelector(`[data-value="${elementName}"]`);
        if (!currAnswerEl)
            console.error(`No element with name "${elementName}" exists!`);
        else
            currAnswerEl.setAttribute("data-correct", "");
        function tableClickCB(e) {
            if (e.target === tableEl)
                return;
            tableEl.addEventListener("click", tableClickCB);
            resolve(e.target === currAnswerEl);
        }
        tableEl.addEventListener("click", tableClickCB);
        revealPage(ownerPage);
    });
}
function handleCompareQuestion(field) {
    // Normalize page before use
    const inputEl = comparePage.querySelector(".input");
    const elementLeftEl = inputEl.querySelector(".input .element[data-left]");
    const elementRightEl = inputEl.querySelector(".input .element[data-right]");
    elementLeftEl.setAttribute("data-incorrect", "");
    elementRightEl.setAttribute("data-incorrect", "");
    return new Promise(async (resolve) => {
        await hideAllPages();
        const questionEl = comparePage.querySelector(".question");
        const goForLower = Math.random() < .5;
        if (goForLower)
            questionEl.setAttribute("data-comparison", "LOWER");
        else
            questionEl.setAttribute("data-comparison", "HIGHER");
        const fieldEl = comparePage.querySelector("[data-field]");
        fieldEl.textContent = splitCapitalCase(field);
        const answerEl = comparePage.querySelector("[data-answer]");
        const elements = getRandomElements(2, field);
        const sign = goForLower ? -1 : 1;
        const correctElement = elements.reduce((outlier, element) => {
            const outValue = outlier[field];
            const curValue = element[field];
            return sign * curValue > sign * outValue ? element : outlier;
        });
        answerEl.textContent = String(correctElement["Element"]);
        const elementEls = [elementLeftEl, elementRightEl];
        if (Math.random() < .5)
            [elementEls[0], elementEls[1]] = [elementEls[1], elementEls[0]];
        for (let i = 0; i < 2; ++i) {
            populateElementData(elementEls[i], elements[i], field);
            if (correctElement === elements[i]) {
                elementEls[i].removeAttribute("data-incorrect");
            }
        }
        function clickCB(e) {
            const target = e.target;
            if (target === inputEl)
                return;
            inputEl.removeEventListener("click", clickCB);
            resolve(!target.hasAttribute("data-incorrect"));
        }
        inputEl.addEventListener("click", clickCB);
        revealPage(comparePage);
    });
}
function handleOutlierQuestion(field) {
    return new Promise(async (resolve) => {
        await hideAllPages();
        const dataType = dataTypes[field];
        const elementTemplate = outlierPage.querySelector("#element");
        const questionEl = outlierPage.querySelector(".question");
        const fieldEl = questionEl.querySelector("[data-field]");
        const answerEl = outlierPage.querySelector("[data-answer]");
        const inputEl = outlierPage.querySelector(".input");
        fieldEl.textContent = splitCapitalCase(field);
        // Checking the dataset shows that all 6 elements is not too much to run into empty edge cases
        const elementCount = 6;
        const elements = [];
        // IDEA: maybe rewrite to use maxElements rather than element count due to
        // possible bias towards largers groups being the "incorrect" group
        if (dataType.type === 'NUMBER') {
            // Pick a "correct" element, then find either lower or higher
            const findHigherAnswer = Math.random() < .5;
            const sign = findHigherAnswer ? 1 : -1;
            const sorted = tableElements.toSorted((a, b) => sign * a[field] - sign * b[field]);
            const idx = randIntInRange(sorted.length, elementCount);
            const correctElement = sorted[idx];
            elements.push(correctElement);
            const incorrectElements = sorted.slice(0, idx);
            moveRandomFromArray(incorrectElements, elements, elementCount);
            answerEl.textContent = String(correctElement["Element"]);
            questionEl.setAttribute("data-comparison", findHigherAnswer ? "HIGHER" : "LOWER");
        }
        else {
            const grouped = Object.groupBy(tableElements, (el) => String(el[field]));
            const [correctCategory, ...restCategories] = Object.keys(grouped).sort(() => Math.random() - 0.5);
            const correctGroup = grouped[correctCategory];
            const correctElement = correctGroup[randIntInRange(correctGroup.length)];
            elements.push(correctElement);
            for (const category of restCategories.sort(() => Math.random() - 0.5)) {
                const group = grouped[category];
                if (group.length < elementCount - 1)
                    continue; // too small
                moveRandomFromArray(group, elements, elementCount);
                break;
            }
            answerEl.textContent = String(correctElement["Element"]);
            if (dataType.type === "ENUM")
                questionEl.setAttribute("data-comparison", "DIFFERENT");
            else
                questionEl.setAttribute("data-comparison", correctElement[field] ? "POSITIVE" : "NEGATIVE");
        }
        // Build HTML
        const elementEls = elements.map((e, i) => {
            const fragment = elementTemplate.content.cloneNode(true);
            const btn = fragment.querySelector('.element');
            populateElementData(btn, e, field);
            if (!i)
                btn.removeAttribute("data-incorrect"); // First element is always the correct one
            return fragment;
        }).sort(() => Math.random() - .5);
        function clickCB(e) {
            const target = e.target;
            if (target === inputEl)
                return;
            inputEl.removeEventListener("click", clickCB);
            resolve(!target.hasAttribute("data-incorrect"));
        }
        inputEl.addEventListener("click", clickCB);
        inputEl.replaceChildren(...elementEls);
        revealPage(outlierPage);
    });
}
function handleBooleanQuestion(field) {
    const inputEl = booleanPage.querySelector(".input");
    const trueEl = inputEl.querySelector("[data-value=\"TRUE\"]");
    const falseEl = inputEl.querySelector("[data-value=\"FALSE\"]");
    trueEl.setAttribute("data-incorrect", "");
    falseEl.setAttribute("data-incorrect", "");
    return new Promise(async (resolve) => {
        await hideAllPages();
        const fieldEl = booleanPage.querySelector("[data-field]");
        fieldEl.textContent = splitCapitalCase(field);
        const elementEl = booleanPage.querySelector("[data-element]");
        const element = getRandomElement();
        elementEl.textContent = String(element["Element"]);
        const vowelIsNext = booleanPage.querySelector(".vowel-is-next");
        if ("aeiouAEIOU".includes(field[0]))
            vowelIsNext.classList.remove("hide");
        else
            vowelIsNext.classList.add("hide");
        const value = element[field];
        (value ? trueEl : falseEl).removeAttribute("data-incorrect");
        function clickCB(e) {
            const target = e.target;
            if (target === inputEl)
                return;
            inputEl.removeEventListener("click", clickCB);
            resolve(value && target === trueEl ||
                !value && target === falseEl);
        }
        inputEl.addEventListener("click", clickCB);
        revealPage(booleanPage);
    });
}
function handleCategoryQuestion(field) {
    return new Promise(async (resolve, reject) => {
        await hideAllPages();
        const dataType = dataTypes[field];
        if (dataType.type !== 'ENUM') {
            reject(Error(`"${field}" datatype is not ENUM`));
            return;
        }
        const element = getRandomElement();
        const answer = element[field];
        if (typeof answer === 'boolean') {
            reject(Error(`Invalid ${element}[${field}] datatype`));
            return;
        }
        const fieldEl = categoryPage.querySelector("[data-field]");
        fieldEl.textContent = splitCapitalCase(field);
        const elementEl = categoryPage.querySelector("[data-element]");
        elementEl.textContent = String(element["Element"]);
        const answerEl = categoryPage.querySelector("[data-answer]");
        const unit = dataTypes[field].unit ?? "";
        answerEl.textContent = `${answer} ${unit}`.trim();
        const selectEl = categoryPage.querySelector("[data-select]");
        const values = ["", ...dataType.values];
        selectEl.replaceChildren(...values.map(value => {
            const optionEl = document.createElement("option");
            optionEl.textContent = optionEl.value = String(value);
            return optionEl;
        }));
        selectEl.value = "";
        selectEl.disabled = false;
        const confirmBtn = categoryPage.querySelector("[data-confirm]");
        confirmBtn.addEventListener("click", function selectCB() {
            if (selectEl.value === "")
                return;
            selectEl.disabled = true;
            selectEl.removeEventListener("click", selectCB);
            resolve(selectEl.value === String(answer));
        });
        revealPage(categoryPage);
    });
}
async function handleMenuSwitch(score) {
    await hideAllPages();
    menuPage.setAttribute('data-has-played', "");
    const scoreEl = menuPage.querySelector("[data-score]");
    scoreEl.textContent = String(score);
    revealPage(menuPage, false);
}
async function nextQuestion() {
    let score = 0;
    while (true) {
        const field = getRandomField();
        const action = getRandomAction(field);
        let isCorrect = null; // can be null for debugging purposes
        switch (action) {
            case "VALUE":
                isCorrect = await handleValueQuestion(field);
                break;
            case "OWNER":
                isCorrect = await handleOwnerQuestion(field);
                break;
            case "COMPARE":
                isCorrect = await handleCompareQuestion(field);
                break;
            case "BOOLEAN":
                isCorrect = await handleBooleanQuestion(field);
                break;
            case "CATEGORY":
                isCorrect = await handleCategoryQuestion(field);
                break;
            case "OUTLIER":
                isCorrect = await handleOutlierQuestion(field);
                break;
        }
        if (isCorrect === null)
            continue;
        await beforeNextPage(isCorrect);
        if (isCorrect)
            ++score;
        else
            break;
    }
    handleMenuSwitch(score);
}
function main() {
    // Bind start btn early
    const startBtn = menuPage.querySelector(".start");
    startBtn.addEventListener("click", nextQuestion);
}
main();
export {};
