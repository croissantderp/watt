import fetch from "node-fetch";
import fs from "fs";

const prev = JSON.parse(fs.readFileSync('../input/clubs.json'));
const raw = await (await fetch('https://docs.google.com/spreadsheets/u/1/d/e/2PACX-1vQ-UXugiZ8GznB367cO8JptTO9BLm5OE4D3WO8oZvYk_365lY25Q6eAFNSEIC5DGXGWOXwK_wauoTFT/pub?output=tsv')).text();

const data = raw.split('\n').map(row => row.split('\t'));

const similarity = (a, b) => {
    let lcs = (a, b) => { // longest common substring
        let maxsubstr = "";
        let starta = 0;
        let enda = 0;
        let startb = 0;
        let endb = 0;
        for (let i = 0; i < a.length; i++) {
            for (let j = i + 1; j <= a.length; j++) {
                let substr = a.slice(i, j);

                let ind = b.indexOf(substr);
                if (substr.length > maxsubstr.length && ind >= 0) {
                    maxsubstr = substr;

                    [starta, enda, startb, endb] = [i, j, ind, ind + substr.length];
                }
            }
        }

        // returns longest substring, its length, the start/end of it in a and b.
        return [maxsubstr, maxsubstr.length, starta, enda, startb, endb];
    }

    // returns numerator of the R-O formula thing
    let raw = (a, b) => {
        let longest = lcs(a, b);
        if (longest[1] === 0) {
            return 0;
        }
        return longest[1] + raw(a.slice(0, longest[2]), b.slice(0, longest[4])) + raw(a.slice(longest[3]), b.slice(longest[5]));
    };

    return raw(a.toLowerCase(), b.toLowerCase()) * 2 / (a.length + b.length);

}
const newID = () => 10000 + Math.floor(Math.random() * 90000) + '';
// console.log(data);

const clubs = data.slice(1) // first is header
    .map(club => {
        const [ReturningOrNew, name, typeText, desc, day, time, room, prez, advisor, email, coadvisor, coemail] = club.map(x => x.trim());
        const newClub = (ReturningOrNew.toLowerCase().includes('new'));
        const tier = parseInt(typeText[5]);

        const extras = coadvisor.length > 0 ? {
            coadvisor, coemail
        } : {};
        return {
            new: newClub,
            name,
            tier,
            desc,
            day,
            time,
            room,
            prez,
            advisor,
            email,
            ...extras
        }
    })

const FINAL = {timestamp: new Date(), data: {}};

for (const club of clubs) {

    let match = null;
    for (const key in prev.data) {
        if (similarity(prev.data[key].name, club.name) > 0.85) {
            console.log(`Matched ${prev.data[key].name} with ${club.name}`);
            // same club
            match = key;
            break;
        }
    }

    FINAL.data[match ?? newID()] = club;
}

const str = JSON.stringify(FINAL, null, 4);
fs.writeFileSync('../input/clubs.json', str);
fs.writeFileSync('../output/clubs.json', str);