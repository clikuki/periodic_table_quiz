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
function getRandomAction(field, [score, easyThreshold, normalThreshold] = [0, -2, -1]) {
    const dataType = dataTypes[field];
    const actions = [];
    const isNormal = score >= easyThreshold;
    const isHard = score >= normalThreshold;
    if (isNormal && dataType.isUnique)
        actions.push("OWNER", "OWNER", "OWNER");
    if (dataType.isComparable && dataType.type !== 'BOOLEAN') {
        if (isNormal)
            actions.push("COMPARE");
        if (isHard)
            actions.push("COMPARE");
    }
    switch (dataType.type) {
        case "NUMBER":
            if (isHard)
                actions.push("OUTLIER", "VALUE");
            break;
        case "BOOLEAN":
            actions.push("BOOLEAN", "OUTLIER");
            if (isHard)
                actions.push("OUTLIER");
            break;
        case "ENUM":
            if (isNormal)
                actions.push("OUTLIER");
            if (isHard)
                actions.push("OUTLIER", "CATEGORY");
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
class ElementError extends Error {
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
    return new Promise((resolve) => {
        // Page is already open
        if (page.hasAttribute("data-active")) {
            resolve();
            return;
        }
        // If transition event fails to fire for any reason, timer will be used as fallback
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
        page.setAttribute("data-active", "");
    });
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
function setTimer(seconds) {
    const timerEl = document.querySelector(".timer");
    if (!timerEl)
        throw Error("Timer element does not exist!");
    timerEl.removeAttribute("data-hide");
    timerEl.style.setProperty("--percent", "100%");
    const start = Date.now();
    const duration = seconds * 1000;
    const delay = 100; // Delay before ending timer
    return new Promise((resolve) => {
        requestAnimationFrame(function updateTimer() {
            const now = Date.now();
            if (now > start + duration + delay) {
                timerEl.setAttribute("data-hide", "");
                resolve();
            }
            else {
                requestAnimationFrame(updateTimer);
                const percent = Math.max(100 - 100 * (now - start) / duration, 0);
                timerEl.style.setProperty("--percent", `${percent}%`);
            }
        });
    });
}
class Highscores {
    constructor() { }
    static get(mode) {
        return +(localStorage.getItem(mode) ?? 0);
    }
    static update(mode, score) {
        const old = this.get(mode);
        if (old >= score)
            return old;
        localStorage.setItem(mode, String(score));
        return score;
    }
}
function beforeNextPage(correct) {
    return new Promise((resolve) => {
        document.body.setAttribute("data-result", correct ? "CORRECT" : "INCORRECT");
        requestAnimationFrame(() => document.body.addEventListener("click", resolve, { once: true }));
    });
}
function handleValueQuestion(field) {
    const element = getRandomElement();
    const answer = element[field];
    if (typeof answer !== 'number') {
        throw Error(`Invalid ${element}[${field}] datatype`);
    }
    const fieldEl = valuePage.querySelector("[data-field]");
    const elementEl = valuePage.querySelector("[data-element]");
    const answerEl = valuePage.querySelector("[data-answer]");
    const inputEl = valuePage.querySelector("[data-input]");
    const unit = dataTypes[field].unit ?? "";
    return {
        value: new Promise(async (resolve) => {
            await hideAllPages();
            fieldEl.textContent = splitCapitalCase(field);
            elementEl.textContent = String(element["Element"]);
            answerEl.textContent = `${answer} ${unit}`.trim();
            inputEl.value = "";
            inputEl.focus();
            inputEl.addEventListener("keydown", function inputCB(e) {
                if (e.key !== "Enter")
                    return;
                inputEl.removeEventListener("keydown", inputCB);
                resolve(isApproxEqual(inputEl.value, answer));
            });
            revealPage(valuePage);
        }),
        cancel() {
            inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: "Enter" }));
        },
    };
}
function handleOwnerQuestion(field) {
    const element = getRandomElement();
    const elementName = element["Element"].toUpperCase();
    const value = element[field];
    const fieldEl = ownerPage.querySelector("[data-field]");
    const valueEl = ownerPage.querySelector("[data-value]");
    const answerEl = ownerPage.querySelector("[data-answer]");
    const vowelIsNext = ownerPage.querySelector(".vowel-is-next");
    const tableEl = ownerPage.querySelector(".table");
    const prevAnswerEl = tableEl.querySelector("[data-correct]");
    const currAnswerEl = tableEl.querySelector(`[data-value="${elementName}"]`);
    return {
        value: new Promise(async (resolve) => {
            await hideAllPages();
            fieldEl.textContent = splitCapitalCase(field);
            valueEl.textContent = String(value);
            answerEl.textContent = elementName;
            if ("aeiouAEIOU".includes(field[0]))
                vowelIsNext.classList.remove("hide");
            else
                vowelIsNext.classList.add("hide");
            if (prevAnswerEl)
                prevAnswerEl.removeAttribute("data-correct");
            if (!currAnswerEl)
                console.error(`No element with name "${elementName}" exists!`);
            else
                currAnswerEl.setAttribute("data-correct", "");
            function tableClickCB(e) {
                if (e.target === tableEl)
                    return;
                tableEl.removeEventListener("click", tableClickCB);
                resolve(e.target === currAnswerEl);
            }
            tableEl.addEventListener("click", tableClickCB);
            revealPage(ownerPage);
        }),
        cancel() {
            const incorrectEl = tableEl.querySelector("button:not([data-correct])");
            incorrectEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        },
    };
}
function handleCompareQuestion(field) {
    const elements = getRandomElements(2, field);
    const goForLower = Math.random() < .5;
    const sign = goForLower ? -1 : 1;
    const questionEl = comparePage.querySelector(".question");
    const fieldEl = comparePage.querySelector("[data-field]");
    const answerEl = comparePage.querySelector("[data-answer]");
    const inputEl = comparePage.querySelector(".input");
    const elementLeftEl = inputEl.querySelector(".input .element[data-left]");
    const elementRightEl = inputEl.querySelector(".input .element[data-right]");
    const correctElement = elements.reduce((outlier, element) => {
        const outValue = outlier[field];
        const curValue = element[field];
        return sign * curValue > sign * outValue ? element : outlier;
    });
    const elementEls = [elementLeftEl, elementRightEl];
    if (Math.random() < .5)
        [elementEls[0], elementEls[1]] = [elementEls[1], elementEls[0]];
    // Normalize page before use
    elementLeftEl.setAttribute("data-incorrect", "");
    elementRightEl.setAttribute("data-incorrect", "");
    return {
        value: new Promise(async (resolve) => {
            await hideAllPages();
            fieldEl.textContent = splitCapitalCase(field);
            answerEl.textContent = String(correctElement["Element"]);
            if (goForLower)
                questionEl.setAttribute("data-comparison", "LOWER");
            else
                questionEl.setAttribute("data-comparison", "HIGHER");
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
        }),
        cancel() {
            const incorrectEl = elementEls.find(el => el.hasAttribute("data-incorrect"));
            incorrectEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        },
    };
}
function handleOutlierQuestion(field) {
    const dataType = dataTypes[field];
    const elementCount = 6; // dataset shows 6 elems is a reasonable no.
    const elements = [];
    const findHigherAnswer = Math.random() < .5;
    let correctElement;
    const elementTemplate = outlierPage.querySelector("#element");
    const questionEl = outlierPage.querySelector(".question");
    const fieldEl = questionEl.querySelector("[data-field]");
    const answerEl = outlierPage.querySelector("[data-answer]");
    const inputEl = outlierPage.querySelector(".input");
    // IDEA: maybe rewrite to use maxElements rather than element count due to
    // possible bias towards largers groups being the "incorrect" group
    if (dataType.type === 'NUMBER') {
        // Pick a "correct" element, then find either lower or higher
        const sign = findHigherAnswer ? 1 : -1;
        const sorted = tableElements.toSorted((a, b) => sign * a[field] - sign * b[field]);
        const idx = randIntInRange(sorted.length, elementCount);
        correctElement = sorted[idx];
        elements.push(correctElement);
        const incorrectElements = sorted.slice(0, idx);
        moveRandomFromArray(incorrectElements, elements, elementCount);
    }
    else {
        const grouped = Object.groupBy(tableElements, (el) => String(el[field]));
        const [correctCategory, ...restCategories] = Object.keys(grouped).sort(() => Math.random() - 0.5);
        const correctGroup = grouped[correctCategory];
        correctElement = correctGroup[randIntInRange(correctGroup.length)];
        elements.push(correctElement);
        for (const category of restCategories.sort(() => Math.random() - 0.5)) {
            const group = grouped[category];
            if (group.length < elementCount - 1)
                continue; // too small
            moveRandomFromArray(group, elements, elementCount);
            break;
        }
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
    return {
        value: new Promise(async (resolve) => {
            await hideAllPages();
            fieldEl.textContent = splitCapitalCase(field);
            answerEl.textContent = String(correctElement["Element"]);
            let comparisonStr = "DIFFERENT";
            switch (dataType.type) {
                case "NUMBER":
                    comparisonStr = findHigherAnswer ? "HIGHER" : "LOWER";
                    break;
                case "BOOLEAN":
                    comparisonStr = correctElement[field] ? "POSITIVE" : "NEGATIVE";
                    break;
            }
            questionEl.setAttribute("data-comparison", comparisonStr);
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
        }),
        cancel() {
            const incorrectEl = inputEl.querySelector("[data-incorrect]");
            incorrectEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        },
    };
}
function handleBooleanQuestion(field) {
    const element = getRandomElement();
    const value = element[field];
    const fieldEl = booleanPage.querySelector("[data-field]");
    const elementEl = booleanPage.querySelector("[data-element]");
    const vowelIsNext = booleanPage.querySelector(".vowel-is-next");
    const inputEl = booleanPage.querySelector(".input");
    const trueEl = inputEl.querySelector("[data-value=\"TRUE\"]");
    const falseEl = inputEl.querySelector("[data-value=\"FALSE\"]");
    trueEl.setAttribute("data-incorrect", "");
    falseEl.setAttribute("data-incorrect", "");
    return {
        value: new Promise(async (resolve) => {
            await hideAllPages();
            fieldEl.textContent = splitCapitalCase(field);
            elementEl.textContent = String(element["Element"]);
            (value ? trueEl : falseEl).removeAttribute("data-incorrect");
            if ("aeiouAEIOU".includes(field[0]))
                vowelIsNext.classList.remove("hide");
            else
                vowelIsNext.classList.add("hide");
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
        }),
        cancel() {
            (value ? falseEl : trueEl).dispatchEvent(new MouseEvent("click", { bubbles: true }));
        },
    };
}
function handleCategoryQuestion(field) {
    const dataType = dataTypes[field];
    if (dataType.type !== 'ENUM') {
        throw Error(`"${field}" datatype is not ENUM`);
    }
    const element = getRandomElement();
    const answer = element[field];
    if (typeof answer === 'boolean') {
        throw Error(`Invalid ${element}[${field}] datatype`);
    }
    const values = ["", ...dataType.values];
    const unit = dataTypes[field].unit ?? "";
    const fieldEl = categoryPage.querySelector("[data-field]");
    const elementEl = categoryPage.querySelector("[data-element]");
    const answerEl = categoryPage.querySelector("[data-answer]");
    const selectEl = categoryPage.querySelector("[data-select]");
    const confirmBtn = categoryPage.querySelector("[data-confirm]");
    let canceled = false;
    return {
        value: new Promise(async (resolve) => {
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
                if (!canceled && selectEl.value === "")
                    return;
                selectEl.disabled = true;
                selectEl.removeEventListener("click", selectCB);
                resolve(selectEl.value === String(answer));
            });
            revealPage(categoryPage);
        }),
        cancel() {
            canceled = true;
            confirmBtn.dispatchEvent(new MouseEvent("click"));
        },
    };
}
;
const questionHandlers = {
    VALUE: handleValueQuestion,
    OWNER: handleOwnerQuestion,
    COMPARE: handleCompareQuestion,
    BOOLEAN: handleBooleanQuestion,
    CATEGORY: handleCategoryQuestion,
    OUTLIER: handleOutlierQuestion,
};
async function handleMenuSwitch(score, highscore) {
    await hideAllPages();
    document.body.setAttribute("data-result", "NORMAL");
    menuPage.setAttribute("data-has-played", "");
    if (score > highscore)
        menuPage.setAttribute("data-new-highscore", "");
    else
        menuPage.removeAttribute("data-new-highscore");
    const scoreEl = menuPage.querySelector("[data-score]");
    const highscoreEl = menuPage.querySelector("[data-highscore]");
    scoreEl.textContent = String(score);
    highscoreEl.textContent = String(highscore);
    revealPage(menuPage, false);
}
async function startSurvivalMode() {
    let score = 0;
    const easyThreshold = 7;
    const normalThreshold = 20;
    while (true) {
        try {
            const field = getRandomField();
            const action = getRandomAction(field, [score, easyThreshold, normalThreshold]);
            if (!action)
                continue;
            const questionHandler = questionHandlers[action];
            if (!questionHandler)
                continue;
            const isCorrect = await questionHandler(field).value;
            await beforeNextPage(isCorrect);
            if (isCorrect)
                ++score;
            else
                break;
        }
        catch (e) {
            // Try another question if element has null field
            if (!(e instanceof ElementError))
                throw e;
        }
    }
    const modeKey = "SURVIVAL";
    const prevHighscore = Highscores.get(modeKey);
    Highscores.update(modeKey, score);
    handleMenuSwitch(score, prevHighscore);
}
async function startTimedMode() {
    let score = 0;
    let totalQuestions = 0;
    let keepRunning = true;
    let cancelCurrQuestion = () => { };
    setTimer(60).then(() => {
        keepRunning = false;
        cancelCurrQuestion();
    });
    const easyThreshold = 7;
    const normalThreshold = 20;
    while (keepRunning) {
        try {
            const field = getRandomField();
            const action = getRandomAction(field, [score, easyThreshold, normalThreshold]);
            if (!action)
                continue;
            const questionHandler = questionHandlers[action];
            if (!questionHandler)
                continue;
            const res = questionHandler(field);
            cancelCurrQuestion = res.cancel;
            const isCorrect = await res.value;
            // Should I cancel answer page on timer end?
            await beforeNextPage(isCorrect);
            ++totalQuestions;
            if (isCorrect)
                ++score;
        }
        catch (e) {
            // Try another question if element has null field
            if (!(e instanceof ElementError))
                throw e;
        }
    }
    const modeKey = "TIMED";
    const prevHighscore = Highscores.get(modeKey);
    Highscores.update(modeKey, score);
    handleMenuSwitch(score, prevHighscore);
}
function main() {
    // Bind start btns early
    const survivalBtn = menuPage.querySelector("[data-survival]");
    const timedBtn = menuPage.querySelector("[data-timed]");
    function runAfter(cb) {
        return function () {
            if (!menuPage.hasAttribute("data-active"))
                return;
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            cb();
        };
    }
    survivalBtn.addEventListener("click", runAfter(startSurvivalMode));
    timedBtn.addEventListener("click", runAfter(startTimedMode));
}
main();
export {};
