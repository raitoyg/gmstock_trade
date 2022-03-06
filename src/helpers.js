
export async function makeApiRequest(path) {
    try {
        const response = await fetch(`https://api2.vietstock.vn/GM/${path}`); //TODO remove CORS
        return response.json();
    } catch (error) {
        throw new Error(`Vietstock request error: ${error.status}`);
    }
}

// Generate a symbol ID from a pair of the coins
export function generateSymbol(exchange, fromSymbol, toSymbol) {
    const short = `${fromSymbol}/${toSymbol}`;
    return {
        short,
        full: `${exchange}:${short}`,
    };
}