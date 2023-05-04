export interface TabQueryResult {
    id: number;
    url: string;
    title: string;
}

export enum Day {
    MONDAY = 'Monday',
    TUESDAY = 'Tuesday',
    WEDNESDAY = 'Wednesday',
    THURSDAY = 'Thursday',
    FRIDAY = 'Friday',
    SATURDAY = 'Saturday',
    SUNDAY = 'Sunday',
}

export enum Time {
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

export interface Course {
    en_name: string;
    zh_name: string;
    location: string;
    day: Day;
    time: Time;
}

export interface Schedule {
    program: string;
    semester: string;
    department: string;
    teacher: string;
    courses: Course[];
}
