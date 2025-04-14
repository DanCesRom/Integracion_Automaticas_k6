import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 1,
    iterations: 42,
};

let baseUrl = 'https://loupaws.pythonanywhere.com';
let sessionCookie;

// Login solo una vez
export function setup() {
    let loginRes = http.post(
        `${baseUrl}/check-password`,
        'password=CsF2ty9vjx%40VHpbZq7',
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        }
    );

    check(loginRes, {
        '✅ status 200 on login': (r) => r.status === 200,
        '✅ login success is true': (r) => r.json('success') === true,
    });

    sessionCookie = loginRes.cookies?.session?.[0]?.value;

    if (!sessionCookie) {
        throw new Error('❌ No se obtuvo la cookie de sesión');
    }

    return { sessionCookie };
}

// Generar IDs únicos
function generateUniqueID(index) {
    return `unique-id-${index}`;
}

export default function (data) {
    const index = __ITER;
    const isDuplicateTest = index === 41;
    const usedID = generateUniqueID(40); // el último ID para test duplicado
    const cardID = isDuplicateTest ? usedID : generateUniqueID(index);

    const cardData = {
        id: cardID,
        name: 'Pikachu',
        set_name: 'Prismatic Evolutions',
        image_url: 'https://img.pokemondb.net/artwork/large/pikachu.jpg',
        trend_price: '100',
        quantity: 1,
        types: 'Electric',
        regulation: 'All',
        rarity: 'Rare',
    };

    const res = http.post(
        `${baseUrl}/addcard`,
        JSON.stringify(cardData),
        {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `session=${data.sessionCookie}`,
            },
            redirects: 0,
        }
    );

    if (isDuplicateTest) {
        check(res, {
            '❌ status 400 on duplicate card ID': (r) => r.status === 400,
            '❌ error message in response': (r) =>
                r.body.includes('An error occurred') || r.body.includes('already exists'),
        });
    } else {
        check(res, {
            '✅ status 200 on add card (unique id)': (r) => r.status === 200,
        });
    }

    sleep(0.5);
}
