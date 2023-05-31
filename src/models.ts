export interface TabQueryResult {
    id: number;
    url: string;
    title: string;
}

export enum Day {
    NONE = 'NONE',
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
    length: number;
}

export interface Schedule {
    program: string;
    semester: string;
    department: string;
    teacher: string;
    courses: Course[];
}

export const DayMapping: Record<string, Day> = {
    MONDAY: Day.MONDAY,
    TUESDAY: Day.TUESDAY,
    WEDNESDAY: Day.WEDNESDAY,
    THURSDAY: Day.THURSDAY,
    FRIDAY: Day.FRIDAY,
    NONE: Day.NONE,
};

export const TimeMapping: Record<number, Time> = {
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
