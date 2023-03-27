// Get the content element
const content = document.getElementById('content') || document.body;

// Define a type for the result of the chrome.tabs.query function
interface TabQueryResult {
    id: number;
    url: string;
    title: string;
    // You can add more properties here if needed
}

interface Class {
    name: string;
    teacher: string;
    classroom: string;
    time: string;
    duration: number;
}

// Call chrome.tabs.query to get information about the current tab
chrome.tabs.query(
    {currentWindow: true, active: true},
    (tabs: chrome.tabs.Tab[]) => {
        // Convert the chrome.tabs.Tab[] array to TabQueryResult[] array
        const tabQueryResults: TabQueryResult[] = tabs.map(tab => ({
            id: tab.id!,
            url: tab.url!,
            title: tab.title!,
            // You can add more properties here if needed
        }));

        // We only requested information for the active tab, so the array will have a single element
        const activeTab = tabQueryResults[0];
        const activeUrl = activeTab.url;

        // Do something with the active URL, e.g. log it to the console
        if (activeUrl.includes('cof.ntpu.edu.tw')) {
            // Create a button element and append it to the content element
            const button = document.createElement('button');
            button.textContent = 'Button Text';
            content.appendChild(button);
            // call the function getPageSource when the button is clicked
            button.addEventListener('click', () => {
                chrome.scripting
                    .executeScript({
                        target: {tabId: activeTab.id},
                        func: getPageSource,
                    })
                    .then(injectionResults => {
                        console.log('injectionResults: ', injectionResults);
                        const sourceCode = injectionResults[0].result;
                        // the result is html code table of the schedule, add it to the current extension page, and remove the button
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(sourceCode, 'text/html');
                        const table = doc.getElementsByTagName('table')[0];
                        // if a child table exist remove it
                        if (content.getElementsByTagName('table')[0]) {
                            content.removeChild(content.getElementsByTagName('table')[0]);
                        }
                        content.appendChild(table);
                        // add the table schedule to the local storage for the next time
                        localStorage.setItem('table_schedule', sourceCode);
                        content.removeChild(button);
                        // get the class list
                        const classList = getClass(sourceCode);
                        console.log(classList);
                        // create a new button to show the class list
                        const button2 = document.createElement('button');
                        button2.textContent = 'Show Class List';
                        content.appendChild(button2);
                        // add event listener to the button
                        button2.addEventListener('click', () => {
                            // create a new div to show the class list
                            const classListDiv = document.createElement('div');
                            classListDiv.id = 'classListDiv';
                            // add the class list to the div
                            classList.forEach((classInfo) => {
                                const classDiv = document.createElement('div');
                                classDiv.textContent = classInfo;
                                classListDiv.appendChild(classDiv);
                            });
                            // add the div to the content element
                            content.appendChild(classListDiv);
                            // remove the button
                            content.removeChild(button2);
                        });
                    });
            });
        } else {
            // Create a message element and append it to the content element
            const message = document.createElement('div');
            message.id = 'message';
            message.textContent = 'You are not on cof.ntpu.edu.tw';
            content.appendChild(message);

            // Create a link element in a button and append it to the content element
            const link = document.createElement('a');
            link.href = 'https://cof.ntpu.edu.tw';
            link.target = '_blank';
            link.textContent = 'Go to Website';
            const button = document.createElement('button');
            // add class button-cof to the button
            button.classList.add('button-cof');
            button.appendChild(link);
            content.appendChild(button);
        }
    }
);

// Function that return source code
function getPageSource(): string {
    const mainFrame: any = document.querySelector('frame[name="mainFrame"]');
    if (mainFrame) {
        return mainFrame.contentDocument.documentElement.innerHTML
    } else {
        console.error('Frame with name "mainFrame" not found.');
        return "null";
    }
}

function getClass(sourceCode: string): string[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(sourceCode, 'text/html');
    const classList = doc.getElementsByClassName('class');
    const classArray: string[] = [];
    for (let i = 0; i < classList.length; i++) {
        const classElement = classList[i] as HTMLElement;
        const classInfo = classElement.innerText;
        classArray.push(classInfo);
    }
    return classArray;
}

// // Create a logo element and append it to the content element
// const logo = document.createElement('img');
// logo.id = 'logo';
// logo.src = 'assets/fulllogo_nobuffer.png';
// content.prepend(logo);

// check if the table schedule is in the local storage
const tableSchedule = localStorage.getItem('table_schedule');
if (tableSchedule) {
    // if it is, add it to the current extension page
    const parser = new DOMParser();
    const doc = parser.parseFromString(tableSchedule, 'text/html');
    const table = doc.getElementsByTagName('table')[0];
    content.appendChild(table);
}
