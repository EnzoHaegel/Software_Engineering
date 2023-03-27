class CofScheduleExtension {
    private readonly contentElement: HTMLElement;

    constructor() {
        this.contentElement =
            document.getElementById('content') || document.body;
        this.setupTabListener();
        this.setupLocalStorage();
    }

    private setupTabListener(): void {
        chrome.tabs.query(
            {currentWindow: true, active: true},
            (tabs: chrome.tabs.Tab[]) => {
                const tabQueryResults: TabQueryResult[] = tabs.map(tab => ({
                    id: tab.id!,
                    url: tab.url!,
                    title: tab.title!,
                }));

                const activeTab = tabQueryResults[0];
                const activeUrl = activeTab.url;

                if (activeUrl.includes('cof.ntpu.edu.tw')) {
                    this.setupScheduleButton(activeTab);
                } else {
                    this.setupNonCofSiteMessage();
                }
            }
        );
    }

    private setupScheduleButton(activeTab: TabQueryResult): void {
        const button = document.createElement('button');
        button.textContent = 'Import Schedule';
        this.contentElement.appendChild(button);

        button.addEventListener('click', () => {
            chrome.scripting
                .executeScript({
                    target: {tabId: activeTab.id},
                    func: getPageSource,
                })
                .then(injectionResults => {
                    console.log('injectionResults: ', injectionResults);
                    const sourceCode = injectionResults[0].result;
                    // the result is html code table of the schedule, add it to the current extension page
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(sourceCode, 'text/html');
                    const table = doc.getElementsByTagName('table')[0];

                    // if a child table exist remove it
                    if (this.contentElement.getElementsByTagName('table')[0]) {
                        this.contentElement.removeChild(
                            this.contentElement.getElementsByTagName('table')[0]
                        );
                    }

                    localStorage.setItem('table_schedule', sourceCode);
                    this.setupLocalStorage();

                    // const courses = this.parseSchedule(String(table));
                    // console.log(courses);
                    // this.showSchedule(courses);
                });
        });
    }

    private setupNonCofSiteMessage(): void {
        const message = document.createElement('div');
        message.id = 'message';
        message.textContent = 'You are not on cof.ntpu.edu.tw';
        this.contentElement.appendChild(message);

        const link = document.createElement('a');
        link.href = 'https://cof.ntpu.edu.tw';
        link.target = '_blank';
        link.textContent = 'Go to Website';

        const button = document.createElement('button');
        button.classList.add('button-cof');
        button.appendChild(link);

        this.contentElement.appendChild(button);
    }

    private setupLocalStorage(): void {
        const tableSchedule = localStorage.getItem('table_schedule');

        if (tableSchedule) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(tableSchedule, 'text/html');
            const table = doc.getElementsByTagName('table')[0];
            this.contentElement.appendChild(table);

            // check if a button with button_clear_storage as id exist
            if (document.getElementById('button_clear_storage')) {
                return;
            }

            // add a button to clear the local storage
            const button = document.createElement('button');
            button.id = 'button_clear_storage';
            button.textContent = 'Clear Local Storage';
            this.contentElement.appendChild(button);

            button.addEventListener('click', () => {
                localStorage.clear();
                this.contentElement.removeChild(button);
                this.contentElement.removeChild(
                    this.contentElement.getElementsByTagName('table')[0]
                );
            });
        }
    }

    private parseSchedule(html: string): Course[] {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const rows = Array.from(doc.querySelectorAll('tr'));
        const headerCols = Array.from(rows[0].querySelectorAll('th'));
        const days = headerCols.slice(1).map(col => col.textContent?.trim());
        const courses: Course[] = [];

        for (let i = 1; i < rows.length; i++) {
            const cols = Array.from(rows[i].querySelectorAll('td'));
            const time = cols[0]?.textContent?.trim();
            for (let j = 1; j < cols.length; j++) {
                const courseInfo = cols[j].innerHTML.trim().split('<br>');
                if (courseInfo.length >= 3) {
                    const name = courseInfo[0];
                    const location = courseInfo[2];
                    const course = {
                        name,
                        location,
                        day: days[j - 1] || '',
                        time: time || '',
                    };
                    courses.push(course);
                }
            }
        }

        return courses;
    }

    private showSchedule(courses: Course[]): void {
        // create a cool dark theme schedule table with material ui
        const table = document.createElement('table');
        const headerRow = document.createElement('tr');
        const headerCols = ['Name', 'Location', 'Day', 'Time'];
        for (const headerCol of headerCols) {
            const col = document.createElement('th');
            col.textContent = headerCol;
            headerRow.appendChild(col);
        }
        table.appendChild(headerRow);

        for (const course of courses) {
            const row = document.createElement('tr');
            const cols = [
                course.name,
                course.location,
                course.day,
                course.time,
            ];
            for (const col of cols) {
                const colElement = document.createElement('td');
                colElement.textContent = col;
                row.appendChild(colElement);
            }
            table.appendChild(row);
        }
        this.contentElement.appendChild(table);
    }
}

// Function that return source code
function getPageSource(): string {
    const mainFrame: any = document.querySelector('frame[name="mainFrame"]');
    if (mainFrame) {
        return mainFrame.contentDocument.documentElement.innerHTML;
    } else {
        console.error('Frame with name "mainFrame" not found.');
        return 'null';
    }
}

new CofScheduleExtension();
