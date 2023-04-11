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

                if (
                    activeUrl.includes('cof.ntpu.edu.tw') ||
                    activeUrl.includes('my.ntpu.edu.tw/')
                ) {
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

                    const courses = this.parseHtmlToCourses(sourceCode);
                    console.log(courses);
                    this.showSchedule(courses);
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
        const tableSchedule = localStorage.getItem('table_schedulev2');

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

    private parseHtmlToCourses = (html: string): Course[] => {
        const days = ['Mon.', 'Tue.', 'Wed.', 'Thur.', 'Fri.', 'Sat.', 'Sun.'];
        const courses: Course[] = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('tr');
        rows.forEach(row => {
            const time = row.querySelector('th')?.textContent?.trim() || '';
            if (time) {
                const cells = row.querySelectorAll('td');
                cells.forEach((cell, dayIndex) => {
                    const courseElements = cell.querySelectorAll(
                        'font:not([color="green"])'
                    );
                    const locationElement = cell.querySelector(
                        'font[color="green"]'
                    );
                    if (courseElements.length > 0) {
                        const en_name =
                            courseElements[0]?.textContent?.trim() || '';
                        const zh_name =
                            courseElements[1]?.textContent?.trim() || '';
                        const location =
                            locationElement?.textContent?.trim() || '';
                        const day = days[dayIndex];
                        courses.push({
                            en_name,
                            zh_name,
                            location,
                            day,
                            time: time.slice(1),
                        });
                    }
                });
            }
        });
        return courses;
    };

    private showSchedule(courses: Course[]): void {
        const days = ['Mon.', 'Tue.', 'Wed.', 'Thur.', 'Fri.'];
        const table = document.createElement('table');
        // add class "schedule" to the table
        table.classList.add('schedule');

        // Table header
        const header = document.createElement('tr');
        days.unshift('');
        days.forEach(headerName => {
            const th = document.createElement('th');
            th.textContent = headerName;
            header.appendChild(th);
        });
        table.appendChild(header);

        // Table body
        for (let i = 1; i <= 10; i++) {
            const tr = document.createElement('tr');
            for (let j = 0; j < 6; j++) {
                const td = document.createElement('td');

                if (j === 0) {
                    td.textContent = `${i + 8}:10~${i + 9}:00`;
                    td.style.backgroundColor = '#383838';
                } else {
                    const course = courses.find(
                        course =>
                            course.day === days[j] &&
                            course.time === `${i + 8}:10~${i + 9}:00`
                    );

                    if (course) {
                        td.innerHTML = `
                  <div>${course.en_name}</div>
                  <div><small>${course.zh_name}</small></div>
                  <div><small style="color: #32cd32">${course.location}</small></div>
                `;
                    }
                }
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        // Add table to the DOM
        const container = document.getElementById('scheduleContainer');
        if (container) {
            container.innerHTML = '';
            const oldTable = container.querySelector('table');
            if (oldTable) {
                container.removeChild(oldTable);
            }
            localStorage.setItem('table_schedulev2', table.outerHTML);
            container.appendChild(table);
        } else {
            console.error(
                'Container element with ID "scheduleContainer" not found.'
            );
        }
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
