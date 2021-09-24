import {useContext} from 'react';
import {Progress} from 'reactstrap';
import {Moment} from 'moment';

// Data
import schedule from '../../data/schedule';
import alternates from '../../data/alternates';

// Context
import UserDataContext, {UserData} from '../../contexts/UserDataContext';

// Utils
import {DayObj, numToWeekday, parsePeriodName, sortPeriodsByStart, SCHOOL_START, SCHOOL_END_EXCLUSIVE} from './Periods';


type PeriodIndicatorProps = {currTime: Moment, startTime: number};
export default function PeriodIndicator(props: PeriodIndicatorProps) {
    const {currTime, startTime} = props;
    const userData = useContext(UserDataContext);

    const midnight = currTime.clone().startOf('date');
    const minutes = currTime.diff(midnight, 'minutes');
    const seconds = currTime.diff(midnight, 'seconds');

    const periods = parseNextPeriod(currTime, minutes, userData);
    if (!periods) return null;
    const {next, prev} = periods;

    const startingIn = next[1].s - minutes;
    const endingIn = next[1].e - minutes;

    // If current period has yet to start
    if (startingIn > 0) {
        const end = prev?.[1].e ?? startTime - 20;
        return (
            <div className="period-indicator">
                <p>
                    <strong>{parsePeriodName(next[0], userData)}</strong>{' '}
                    starting in {startingIn} minute{startingIn !== 1 ? 's' : ''}.
                </p>
                <Progress
                    value={(seconds / 60 - end) / (next[1].s - end) * 100}
                    style={{backgroundColor: 'var(--tertiary)'}}
                    barStyle={{backgroundColor: 'var(--primary)'}}
                />
            </div>
        )
    }

    return (
        <div className="period-indicator">
            <p>
                <strong>{parsePeriodName(next[0], userData)}</strong>{' '}
                ending in {endingIn} minute{endingIn !== 1 ? 's' : ''},{' '}
                started {-startingIn} minute{startingIn !== -1 ? 's' : ''} ago.
            </p>
            <Progress
                value={(seconds / 60 - next[1].s) / (next[1].e - next[1].s) * 100}
                style={{backgroundColor: 'var(--tertiary)'}}
                barStyle={{backgroundColor: 'var(--primary)'}}
            />
        </div>
    )
}


// Returns the current period given the current time and user preferences
export function parseNextPeriod(currTime: Moment, minutes: number, userData: UserData) {
    // If the current date falls on summer break, return early
    if (currTime.isBefore(SCHOOL_START) || currTime.isAfter(SCHOOL_END_EXCLUSIVE)) {
        return null;
    }

    // Alternates checking
    const altFormat = currTime.format('MM-DD');
    if (alternates.alternates.hasOwnProperty(altFormat)) {
        return parsePeriodFromJSON(minutes, alternates.alternates[altFormat]!, userData);
    }
    return parsePeriodFromJSON(minutes, schedule[numToWeekday(Number(currTime.format('d')))], userData);
}

// Returns the current period given the current time and a set JSON object
// A period is current if the current time is within the bounds of that period
// or, if no periods match the former criteria, if that period is the next period to start
function parsePeriodFromJSON(minutes: number, periods: DayObj | null, userData: UserData) {
    if (!periods) return null;

    const flattened = sortPeriodsByStart(periods).filter(([name, per]) => {
        if (name === '0' && !userData.options.period0) return false;
        if (name === '8' && !userData.options.period8) return false;
        return true;
    });
    if (minutes < flattened[0][1].s - 20) return null;

    let currPd // current period index
    for (currPd = 0; currPd < flattened.length; currPd++) {
        if (minutes < flattened[currPd][1].e) {
            break;
        }
    }
    if (currPd >= flattened.length) return null;
    return {prev: flattened[currPd - 1], next: flattened[currPd]};
}
