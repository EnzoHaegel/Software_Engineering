interface TabQueryResult {
    id: number;
    url: string;
    title: string;
}

enum Day {
    NONE = 'NONE',
    MONDAY = 'Monday',
    TUESDAY = 'Tuesday',
    WEDNESDAY = 'Wednesday',
    THURSDAY = 'Thursday',
    FRIDAY = 'Friday',
    SATURDAY = 'Saturday',
    SUNDAY = 'Sunday',
}

enum Time {
    ONE = '1',
    TWO = '2',
    THREE = '3',
    FOUR = '4',
    FIVE = '5',
    SIX = '6',
    SEVEN = '7',
    EIGHT = '8',
    NINE = '9',
    TEN = '10',
}

interface Course {
    en_name: string;
    zh_name: string;
    location: string;
    day: Day;
    time: Time;
}

interface Schedule {
    program: string;
    semester: string;
    department: string;
    teacher: string;
    courses: Course[];
}

const DayMapping: Record<string, Day> = {
    MONDAY: Day.MONDAY,
    TUESDAY: Day.TUESDAY,
    WEDNESDAY: Day.WEDNESDAY,
    THURSDAY: Day.THURSDAY,
    FRIDAY: Day.FRIDAY,
    NONE: Day.NONE,
};

const TimeMapping: Record<number, Time> = {
    1: Time.ONE,
    2: Time.TWO,
    3: Time.THREE,
    4: Time.FOUR,
    5: Time.FIVE,
    6: Time.SIX,
    7: Time.SEVEN,
    8: Time.EIGHT,
    9: Time.NINE,
    10: Time.TEN,
};

class CofScheduleExtension {
    private readonly contentElement: HTMLElement;

    private readonly dayMapping = [
        Day.MONDAY,
        Day.TUESDAY,
        Day.WEDNESDAY,
        Day.THURSDAY,
        Day.FRIDAY,
        Day.NONE,
    ];

    constructor() {
        this.contentElement =
            document.getElementById('content') || document.body;
        this.setupTabListener();
        this.setupLocalStorage();
        // this.setupGoogleCalendarImportButton();
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
                    
                    // if a child table exist remove it
                    if (this.contentElement.getElementsByTagName('table')[0]) {
                        this.contentElement.removeChild(
                            this.contentElement.getElementsByTagName('table')[0]
                        );
                    }
                    const table = doc.getElementsByTagName('table')[0];

                    localStorage.setItem('table_schedule', sourceCode);
                    this.setupLocalStorage();

                    const courses = this.parseHtmlToCourses(sourceCode);
                    localStorage.setItem('Schedule', JSON.stringify(courses));
                    this.showSchedule(courses.courses);
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
        const schedule: Schedule = JSON.parse(
            localStorage.getItem('Schedule')!
        );

        if (schedule) this.showSchedule(schedule.courses);
        if (document.getElementById('button_clear_storage')) return;

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

    private parseHtmlToCourses = (html: string): Schedule => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const h3 = doc.querySelector('h3');
        const h4 = doc.querySelector('h4');
        const table = doc.querySelector('table');

        const programSemester = h3?.textContent?.match(/(\d+)/g) || [];
        const program = programSemester[0];
        const semester = programSemester[1];
        const teacherDept = h4?.textContent?.split(' ') || [];
        const department = teacherDept[1];
        const teacher = teacherDept[2];
        const courses: Course[] = [];
        const trElements = table?.querySelectorAll('tr') || [];
        const timeKeys = Object.keys(Time) as Array<keyof typeof Time>;

        trElements.forEach((tr, i) => {
            if (i === 0) return;
            const tdElements = tr.querySelectorAll('td');

            tdElements.forEach((td, j) => {
                const en_name = td.firstChild?.textContent?.trim() || '';
                const zh_name =
                    td.querySelector("font[size='2']")?.textContent?.trim() ||
                    '';
                const location =
                    td.querySelector("font[size='1']")?.textContent?.trim() ||
                    '';

                // Update the day assignment
                const day = this.dayMapping[j];

                if (day) {
                    const time = Time[timeKeys[i - 1]];

                    const course: Course = {
                        en_name,
                        zh_name,
                        location,
                        day,
                        time,
                    };
                    courses.push(course);
                }
            });
        });

        const schedule: Schedule = {
            program: program || '',
            semester,
            department,
            teacher,
            courses,
        };
        console.log('schedule:', schedule);
        return schedule;
    };

    private showSchedule(courses: Course[]): void {
        localStorage.setItem('printed', 'true');
        const days = [
            {short: 'Mon.', full: Day.MONDAY},
            {short: 'Tue.', full: Day.TUESDAY},
            {short: 'Wed.', full: Day.WEDNESDAY},
            {short: 'Thur.', full: Day.THURSDAY},
            {short: 'Fri.', full: Day.FRIDAY},
        ];
        const table = document.createElement('table');
        table.classList.add('schedule');
        const header = document.createElement('tr');
        days.unshift({short: '', full: Day.NONE});
        days.forEach(headerName => {
            const th = document.createElement('th');
            th.textContent = headerName.short;
            header.appendChild(th);
        });
        table.appendChild(header);

        // Table body
        for (let i = parseInt(Time.ONE); i <= parseInt(Time.TEN); i++) {
            const tr = document.createElement('tr');
            for (let j = 0; j < 6; j++) {
                const td = document.createElement('td');

                if (j === 0) {
                    td.textContent = `${i + 8}:10~${i + 9}:00`;
                    td.style.backgroundColor = '#383838';
                } else {
                    const course = courses.find(
                        course =>
                            course.day === days[j].full &&
                            course.time === i.toString()
                    );

                    if (course) {
                        const enNameDivs = course.en_name
                            .split(' ')
                            .map(word => `<div>${word}</div>`);
                        td.innerHTML = `
                          <div>${enNameDivs.join('')}</div>
                          <div><small>${course.zh_name}</small></div>
                          <div><small style="color: #32cd32">${
                              course.location
                          }</small></div>
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

    // async addCoursesToGoogleCalendar(courses: Course[]) {
    //     const { installed } = await this.getGoogleCredentials();
    //     const { client_id, project_id, auth_uri, token_uri, auth_provider_x509_cert_url, client_secret, redirect_uris } = installed;
    //     const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    
    //     // Check if we have previously stored a token.
    //     const token = await this.getStoredToken();
    //     if (!token) {
    //         // If there's no stored token, get a new token from Google
    //         this.getNewToken(oAuth2Client);
    //     } else {
    //         oAuth2Client.setCredentials(JSON.parse(token));
    
    //         // Add courses to the calendar
    //         const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    //         for (const course of courses) {
    //             const event = this.courseToGoogleCalendarEvent(course);
    //             calendar.events.insert({
    //                 calendarId: 'primary',
    //                 requestBody: event,
    //             }, (err: any, event: any) => {
    //                 if (err) {
    //                     console.log('There was an error contacting the Calendar service: ' + err);
    //                     return;
    //                 }
    //                 console.log('Event created: %s', event.htmlLink);
    //             });
    //         }
    //     }
    // }

    // private async getGoogleCredentials(): Promise<any> {
    //     const credentials = await import('./client_secret_332990903033-uil786vg2fm29le166gsbksb5pgq4qa1.apps.googleusercontent.com.json');
    //     return credentials.default;
    // }
    
    // private async getStoredToken() {
    //     // Implement your own logic here to get the token from wherever you have stored it
    //     const token = localStorage.getItem('token');
    //     return token;
    // }
    
    // private getNewToken(oAuth2Client: OAuth2Client) {
    //     const authUrl = oAuth2Client.generateAuthUrl({
    //         access_type: 'offline',
    //         scope: ['https://www.googleapis.com/auth/calendar.events'],
    //     });
    //     console.log('Authorize this app by visiting this url:', authUrl);
    //     // In a real-world application, you would redirect your user to authUrl, then get the code parameter in the redirected URL
    // }
    
    // private courseToGoogleCalendarEvent(course: Course) {
    //     // Convert your course to Google Calendar event format here
    //     const event = {
    //         summary: `${course.en_name} (${course.zh_name})`,
    //         location: course.location,
    //         description: `${course.en_name} (${course.zh_name}) at ${course.location}`,
    //         start: {
    //             dateTime: 'YYYY-MM-DDT09:00:00-07:00', // Replace this with the actual start time
    //             timeZone: 'Asia/Taipei',
    //         },
    //         end: {
    //             dateTime: 'YYYY-MM-DDT10:00:00-07:00', // Replace this with the actual end time
    //             timeZone: 'Asia/Taipei',
    //         },
    //         recurrence: [
    //             'RRULE:FREQ=WEEKLY;COUNT=10;BYDAY=' + this.dayToRRULEDay(course.day), // Assumes the course is held weekly for 10 weeks
    //         ],
    //     };
    //     return event;
    // }
    
    // private dayToRRULEDay(day: Day) {
    //     // Convert Day to RRULE format
    //     switch (day) {
    //         case Day.MONDAY:
    //             return 'MO';
    //         case Day.TUESDAY:
    //             return 'TU';
    //         case Day.WEDNESDAY:
    //             return 'WE';
    //         case Day.THURSDAY:
    //             return 'TH';
    //         case Day.FRIDAY:
    //             return 'FR';
    //         default:
    //             throw new Error('Invalid day: ' + day);
    //     }
    // }

    // private setupGoogleCalendarImportButton(): void {
    //     const button = document.createElement('button');
    //     button.textContent = 'Import to Google Calendar';
    //     this.contentElement.appendChild(button);

    //     button.addEventListener('click', async () => {
    //         const schedule: Schedule = JSON.parse(
    //             localStorage.getItem('Schedule')!
    //         );

    //         if (schedule) {
    //             try {
    //                 await this.addCoursesToGoogleCalendar(schedule.courses);
    //                 button.textContent = 'Imported to Google Calendar';
    //                 button.disabled = true;
    //             } catch (err) {
    //                 console.error('Failed to import to Google Calendar:', err);
    //                 button.textContent = 'Failed to import to Google Calendar. See console for details.';
    //             }
    //         } else {
    //             console.error('No schedule found in local storage');
    //             button.textContent = 'No schedule found in local storage. Import the schedule first.';
    //         }
    //     });
    // }
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

// 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
