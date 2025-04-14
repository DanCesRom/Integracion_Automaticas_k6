import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 1,
    iterations: 43, // 42 unique + 1 duplicate
};

let baseUrl = 'https://loupaws.pythonanywhere.com';

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

    let sessionCookie = loginRes.cookies?.session?.[0]?.value;

    if (!sessionCookie) {
        throw new Error('❌ No se obtuvo la cookie de sesión');
    }

    return { sessionCookie };
}

// Generate unique card ID
function generateUniqueID(index) {
    return `unique-id-${index}`;
}

export default function (data) {
    const index = __ITER;
    const isDuplicateTest = index === 42; // 43rd iteration
    const cardID = isDuplicateTest ? generateUniqueID(41) : generateUniqueID(index); // use last ID again

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
        }
    );

    if (isDuplicateTest) {
        check(res, {
            '❌ duplicate insert correctly rejected': (r) =>
                r.status === 400 &&
                (r.body.includes('An error occurred') || r.body.includes('already exists')),
        });
    } else {
        check(res, {
            '✅ status 200 on add card (unique id)': (r) => r.status === 200,
        });
    }

    // Run search after add
    const searchUrl = `${baseUrl}/search_cards`;
    const searchParams = {
        name: 'pikachu',
        set_name: 'Prismatic Evolutions',
        type: 'Electric',
        regulation: 'All',
        rarity: 'All',
    };

    const searchRes = http.get(searchUrl, {
        headers: {
            'Cookie': `session=${data.sessionCookie}`,
        },
        params: searchParams,
    });

    check(searchRes, {
        '✅ status 200 on search': (r) => r.status === 200,
        '✅ search body is not empty': (r) => r.body && r.body.length > 2,
    });

    sleep(0.5);
}
