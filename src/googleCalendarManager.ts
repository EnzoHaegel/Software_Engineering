import { Course, Day, Schedule } from "./models.js";

export class GoogleCalendarManager {
    private DayMappingN: Record<Day, number> = {
        [Day.MONDAY]: 1,
        [Day.TUESDAY]: 2,
        [Day.WEDNESDAY]: 3,
        [Day.THURSDAY]: 4,
        [Day.FRIDAY]: 5,
        [Day.SATURDAY]: 6,
        [Day.SUNDAY]: 0,
        [Day.NONE]: 0,
    };

    parseScheduleAndAddToCalendar(schedule: Schedule, token: string): void {
        const courses = schedule.courses;
        const parsedCourses: { [key: string]: Course } = {};
    
        for (let i = 0; i < courses.length; i++) {
            const course = courses[i];
            if (course.en_name === "" && course.zh_name === "") continue;
            if (course.en_name === "")
                course.en_name = course.zh_name;
            const courseKeyBase = `${course.day}-${course.en_name}`;
    
            let courseKey = courseKeyBase;
            let extension = 1;
            while (parsedCourses[courseKey]) {
                if (parseInt(parsedCourses[courseKey].time) + parsedCourses[courseKey].length === parseInt(course.time)) {
                    parsedCourses[courseKey].length++;
                    break;
                } else {
                    extension++;
                    courseKey = `${courseKeyBase}-${extension}`;
                }
            }
    
            if (!parsedCourses[courseKey]) {
                parsedCourses[courseKey] = {
                    en_name: course.en_name,
                    zh_name: course.zh_name,
                    location: course.location,
                    day: course.day,
                    time: course.time,
                    length: 1,
                };
            }
        }
    
        for (const key in parsedCourses) {
            const course = parsedCourses[key];
            this.addEventsToCalendar(token, course);
        }
    }

    async addEventsToCalendar(token: string, course: Course): Promise<void> {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.googleapis.com/calendar/v3/calendars/primary/events');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.setRequestHeader('Content-Type', 'application/json');
    
        const currentWeekStart = this.getWeekStart(new Date());
        const dayAdjustment = this.DayMappingN[course.day] - currentWeekStart.getDay();
        currentWeekStart.setDate(currentWeekStart.getDate() + dayAdjustment);
        const tempTime = parseInt(course.time);
        currentWeekStart.setHours(tempTime > 4 ? 8 + tempTime : 7 + tempTime, 10);
        if(!isValidDate(currentWeekStart)){
            console.log('Invalid start time for course:', course.en_name);
            return;
        }
        const endTime = new Date(currentWeekStart.getTime());
        endTime.setHours(currentWeekStart.getHours() + course.length, 0);
        if(!isValidDate(endTime)){
            console.log('Invalid end time for course:', course.en_name);
            return;
        }
        
        const eventData = {
            'summary': course.en_name,
            'location': course.location,
            'start': {
                'dateTime': currentWeekStart.toISOString(),
                'timeZone': 'Asia/Taipei',
            },
            'end': {
                'dateTime': endTime.toISOString(),
                'timeZone': 'Asia/Taipei',
            },
        };
    
        xhr.onload = () => {
            console.log('Adding event to calendar...');
            console.log("Course: " + course.en_name + " " + course.zh_name + " " + course.location + " " + course.day + " " + course.time);
        };
        await delay(1000);
        xhr.send(JSON.stringify(eventData));
    }

    private getWeekStart(date: Date): Date {
        const weekStart = new Date(date.getTime());
        weekStart.setDate(date.getDate() - date.getDay() + 1);
        return weekStart;
    }
}

function isValidDate(date: { getTime: () => number; }) {
    return date instanceof Date && !isNaN(date.getTime());
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
