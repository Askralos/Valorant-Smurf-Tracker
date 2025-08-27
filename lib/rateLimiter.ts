// lib/rateLimiter.ts
const queue: (() => void)[] = [];
const timestamps: number[] = [];

const MAX_REQUESTS = 30;
const INTERVAL = 60_000; // 1 min

function schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        const run = async () => {
            try {
                const now = Date.now();
                // Nettoyer les timestamps vieux de plus de 1 min
                while (timestamps.length && now - timestamps[0] >= INTERVAL) {
                    timestamps.shift();
                }

                if (timestamps.length >= MAX_REQUESTS) {
                    // Attendre le prochain slot
                    const wait = INTERVAL - (now - timestamps[0]);
                    setTimeout(() => queue.push(run), wait + 10);
                    return;
                }

                timestamps.push(now);
                const result = await fn();
                resolve(result);
            } catch (err) {
                reject(err);
            } finally {
                if (queue.length) queue.shift()?.();
            }
        };

        queue.push(run);
        // Lance immédiatement si possible
        if (queue.length === 1) queue[0]();
    });
}

export default schedule;
