import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
    vus: 5,
    duration: '10s',
};

export default function () {
    // 1. LOGIN
    let loginRes = http.post(
        'https://loupaws.pythonanywhere.com/check-password',
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
        console.error('❌ No se obtuvo la cookie de sesión. Abortando prueba.');
        return;
    }

    // Verificar las cookies
    console.log('Cookies de sesión: ', loginRes.cookies);

    // 2. SEARCH FILTERS (solo si login fue exitoso)
    let searchUrl = 'https://loupaws.pythonanywhere.com/search_cards';
    let params = {
        name: 'pikachu',
        set_name: 'Prismatic Evolutions',
        type: 'Electric',
        regulation: 'All',
        rarity: 'All',
    };

    let searchRes = http.get(searchUrl, {
        headers: {
            'Cookie': `session=${sessionCookie}`, // Asegúrate de que esta cookie esté presente
        },
        params: params, // Se codifican los parámetros automáticamente como query string
    });

    check(searchRes, {
        '✅ status 200 on search': (r) => r.status === 200,
        '✅ search body is not empty': (r) => r.body && r.body.length > 2,
    });

    sleep(1);
}
