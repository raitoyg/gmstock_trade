const configurationData = {
    supported_resolutions: ['1D', '1W', '1M'],
    exchanges: [
        {
            value: 'HOSE',
            name: 'HOSE',
            desc: 'Ho Chi Minh City Stock Exchange', //Bitfinex
        },
        {
            value: 'HNX',
            name: 'HNX',
            desc: 'Hanoi Stock Exchange',
        },
        {
            value: 'UPCOM',
            name: 'UPCOM',
            desc: 'UPCOM',
        }
    ],
    symbols_types: [
        {
            name: 'stock',

            // `symbolType` argument for the `searchSymbols` method, if a user selects this symbol type
            value: 'stock',
        },
        // ...
    ],
};

import { makeApiRequest, generateSymbol } from './helpers.js';
import json from "../data/HOSE_HNX_UPCOM_symbols.json" assert { type: "json" };

// ...
async function getAllSymbols() {
    // const data = await makeApiRequest('data/v3/all/exchanges');
    const data = json.symbol_data;
    let allSymbols = [];

    for (const exchange of configurationData.exchanges) {
        var filteredData = data.filter(function (filter) {
            return filter.exchange == exchange.value
        });
        for (const data of filteredData) {
            const symbol = {
                symbol: data.symbol,
                full_name: data.symbol,
                description: data.name,
                exchange: exchange.value,
                type: 'stock',
            }
            allSymbols.push(symbol)
        }
    }
    return allSymbols;
}

export default {
    onReady: (callback) => {
        console.log('[onReady]: Method call');
        setTimeout(() => callback(configurationData));
    },
    searchSymbols: async (
        userInput,
        exchange,
        symbolType,
        onResultReadyCallback
    ) => {
        console.log('[searchSymbols]: Method call');
        const symbols = await getAllSymbols();
        const newSymbols = symbols.filter(symbol => {
            const isExchangeValid = exchange === '' || symbol.exchange === exchange;
            const isFullSymbolContainsInput = symbol.full_name
                .toLowerCase()
                .indexOf(userInput.toLowerCase()) !== -1;
            return isExchangeValid && isFullSymbolContainsInput;
        });
        onResultReadyCallback(newSymbols);
    },
    resolveSymbol: async (
        symbolName,
        onSymbolResolvedCallback,
        onResolveErrorCallback
    ) => {
        console.log('[resolveSymbol]: Method call', symbolName);
        const symbols = await getAllSymbols();
        const symbolItem = symbols.find(({ full_name }) => full_name === symbolName);
        if (!symbolItem) {
            console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
            onResolveErrorCallback('cannot resolve symbol');
            return;
        }
        const symbolInfo = {
            ticker: symbolItem.full_name,
            name: symbolItem.symbol,
            description: symbolItem.description,
            type: symbolItem.type,
            session: '24x7',
            timezone: 'Etc/UTC',
            exchange: symbolItem.exchange,
            minmov: 1,
            pricescale: 100,
            has_intraday: false,
            has_no_volume: true,
            has_weekly_and_monthly: false,
            supported_resolutions: configurationData.supported_resolutions,
            volume_precision: 2,
            data_status: 'streaming',
        };

        console.log('[resolveSymbol]: Symbol resolved', symbolName);
        onSymbolResolvedCallback(symbolInfo);
    },
    getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
        const { from, to, firstDataRequest } = periodParams;
        var fromDate = new Date(from*1000).toLocaleDateString('en-US')
        var toDate = new Date(to*1000).toLocaleDateString('en-US')
        console.log('[getBars]: Method call', symbolInfo, resolution, from, to);
        const urlParameters = {
            code: symbolInfo.name,
            FromDate:fromDate,
            ToDate:toDate,
            pagesize: 1000,
        };
        const query = Object.keys(urlParameters)
            .map(name => `${name}=${encodeURIComponent(urlParameters[name])}`)
            .join('&');
        //Basically create this e=Bitfinex&fsym=BTC&tsym=USD&toTs=1642291200&limit=2000
        try {
            const data = await makeApiRequest(`stocktradinginfo?${query}&token=3D95695BE7AE48FAAB182C812618CDC3`);
            if (data.Response && data.Response === 'Error' || data.length === 0) {
                // "noData" should be set if there is no data in the requested period.
                onHistoryCallback([], { noData: true });
                return;
            }
            let bars = [];
            data.forEach(bar => {
                if ((Date.parse(bar.TradingDate)/1000) >= from && (Date.parse(bar.TradingDate)/1000) < to) {
                    const barr = {
                        time: Date.parse(bar.TradingDate),
                        low: bar.LowestPrice,
                        high: bar.HighestPrice,
                        open: bar.OpenPrice,
                        close: bar.ClosePrice,
                    }
                    bars.push(barr)
                }
            });
            console.log(`[getBars]: returned ${bars.length} bar(s)`);
            onHistoryCallback(bars, { noData: false });
        } catch (error) {
            console.log('[getBars]: Get error', error);
            onErrorCallback(error);
        }
    },
    subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
        console.log('[subscribeBars]: Method call with subscribeUID:', subscribeUID);
    },
    unsubscribeBars: (subscriberUID) => {
        console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
    },
};