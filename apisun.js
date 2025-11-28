// ====================== UTILITIES (GIỮ NGUYÊN) ======================
function parseLines(lines) {
    const arr = lines.map(l => (typeof l === 'string' ? JSON.parse(l) : l));
    return arr.map(item => ({
        session: item.session,
        dice: item.dice,
        total: item.total,
        result: item.result,
        tx: item.total >= 11 ? 'T' : 'X'
    })).sort((a, b) => a.session - b.session);
}

function lastN(arr, n) {
    return arr.slice(Math.max(0, arr.length - n));
}

function unique(arr) {
    return Array.from(new Set(arr));
}

function majority(obj) {
    let maxK = null,
        maxV = -Infinity;
    for (const k in obj)
        if (obj[k] > maxV) {
            maxV = obj[k];
            maxK = k;
        }
    return {
        key: maxK,
        val: maxV
    };
}

function sum(nums) {
    return nums.reduce((a, b) => a + b, 0);
}

function avg(nums) {
    return nums.length ? sum(nums) / nums.length : 0;
}

function entropy(arr) {
    if (!arr.length) return 0;
    const freq = arr.reduce((a, v) => {
        a[v] = (a[v] || 0) + 1;
        return a;
    }, {});
    const n = arr.length;
    let e = 0;
    for (const k in freq) {
        const p = freq[k] / n;
        e -= p * Math.log2(p);
    }
    return e;
}

function similarity(a, b) {
    if (a.length !== b.length) return 0;
    let m = 0;
    for (let i = 0; i < a.length; i++)
        if (a[i] === b[i]) m++;
    return m / a.length;
}

function extractFeatures(history) {
    const tx = history.map(h => h.tx);
    const totals = history.map(h => h.total);
    const features = {
        tx,
        totals,
        freq: tx.reduce((a, v) => {
            a[v] = (a[v] || 0) + 1;
            return a;
        }, {})
    };

    let runs = [],
        cur = tx[0],
        len = 1;
    for (let i = 1; i < tx.length; i++) {
        if (tx[i] === cur) len++;
        else {
            runs.push({
                val: cur,
                len
            });
            cur = tx[i];
            len = 1;
        }
    }
    if (tx.length) runs.push({
        val: cur,
        len
    });
    features.runs = runs;
    features.maxRun = runs.reduce((m, r) => Math.max(m, r.len), 0) || 0;

    features.meanTotal = avg(totals);
    features.stdTotal = Math.sqrt(avg(totals.map(t => Math.pow(t - features.meanTotal, 2))));
    features.entropy = entropy(tx);

    return features;
}

// ====================== CÁC THUẬT TOÁN CON (Đã tối ưu + 2 thuật toán mới) ======================
function algo1_cycle3(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 6) return null;
    const p = tx.slice(-6, -3).join('');
    const q = tx.slice(-3).join('');
    if (p === q) return tx.at(-1) === 'T' ? 'X' : 'T';
    return null;
}

function algo2_alternate2(history) {
    const tx = history.map(h => h.tx).slice(-4);
    if (tx.length < 4) return null;
    if (tx[0] !== tx[1] && tx[1] === tx[2] && tx[2] !== tx[3]) {
        return tx.at(-1) === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo3_threeRepeat(history) {
    const tx = history.map(h => h.tx);
    const last3 = tx.slice(-3);
    if (last3.length === 3 && last3[0] === last3[1] && last3[1] === last3[2]) {
        return last3[0] === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo4_double2pattern(history) {
    const tx = history.map(h => h.tx).slice(-4);
    if (tx.length === 4 && tx[0] === tx[1] && tx[2] === tx[3] && tx[0] !== tx[2]) {
        return tx.at(-1) === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo5_freqRebalance(history) {
    const tx = history.map(h => h.tx);
    const freq = tx.reduce((a, v) => {
        a[v] = (a[v] || 0) + 1;
        return a;
    }, {});
    if ((freq['T'] || 0) > (freq['X'] || 0) + 1) return 'X';
    if ((freq['X'] || 0) > (freq['T'] || 0) + 1) return 'T';
    return null;
}

function algo6_longRunReversal(history) {
    const f = extractFeatures(history);
    if (f.runs.at(-1)?.len >= 4) {
        return history.at(-1).tx === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo7_threePatternReversal(history) {
    const tx = history.map(h => h.tx).slice(-3);
    if (tx.length === 3 && tx[0] !== tx[1] && tx[1] === tx[2]) {
        return tx.at(-1) === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo9_twoOneSwitch(history) {
    const tx = history.map(h => h.tx).slice(-3);
    if (tx.length === 3 && tx[0] === tx[1] && tx[1] !== tx[2]) {
        return tx[2] === 'T' ? 'X' : 'T';
    }
    return null;
}

function algo10_newSequenceFollow(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 8) return null;
    const last8 = tx.slice(-8).join('');
    if (!tx.slice(0, -8).join('').includes(last8)) return tx.at(-1);
    return null;
}

function algoA_markov(history) {
    const tx = history.map(h => h.tx);
    const order = 3;
    if (tx.length < order + 1) return null;
    const transitions = {};
    for (let i = 0; i <= tx.length - order - 1; i++) {
        const key = tx.slice(i, i + order).join('');
        const next = tx[i + order];
        transitions[key] = transitions[key] || {
            T: 0,
            X: 0
        };
        transitions[key][next]++;
    }
    const lastKey = tx.slice(-order).join('');
    const counts = transitions[lastKey];
    if (!counts) return null;
    if (counts.T === counts.X) return null;
    return (counts['T'] > counts['X']) ? 'T' : 'X';
}

function algoB_ngram(history) {
    const tx = history.map(h => h.tx);
    const k = 4;
    if (tx.length < k + 1) return null;
    const lastGram = tx.slice(-k).join('');
    let counts = {
        T: 0,
        X: 0
    };
    for (let i = 0; i <= tx.length - k - 1; i++) {
        const gram = tx.slice(i, i + k).join('');
        if (gram === lastGram) counts[tx[i + k]]++;
    }
    if (counts.T === counts.X) return null;
    return counts.T > counts.X ? 'T' : 'X';
}

function algoC_entropy(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 20) return null;
    const eRecent = entropy(tx.slice(-10));
    const eOlder = entropy(tx.slice(0, Math.max(0, tx.length - 10)));
    if (eRecent < 0.7 && eOlder - eRecent > 0.1) {
        return tx.at(-1);
    }
    if (eRecent > 1.2 && eRecent - eOlder > 0.1) {
        return tx.at(-1) === 'T' ? 'X' : 'T';
    }
    return null;
}

function algoD_dicePattern(history) {
    const map = {};
    for (const h of history) {
        const d = h.dice;
        const uniq = unique(d);
        let kind = 'distinct';
        if (uniq.length === 1) kind = 'triple';
        else if (uniq.length === 2) kind = 'pair';
        map[kind] = map[kind] || {
            T: 0,
            X: 0
        };
        map[kind][h.tx] = (map[kind][h.tx] || 0) + 1;
    }
    const lastDice = history.at(-1).dice;
    const lastKind = unique(lastDice).length === 1 ? 'triple' : (unique(lastDice).length === 2 ? 'pair' : 'distinct');
    const counts = map[lastKind];
    if (!counts) return null;
    if (counts.T === counts.X) return null;
    return counts.T > counts.X ? 'T' : 'X';
}

function algoE_runMomentum(history) {
    const runs = extractFeatures(history).runs;
    if (runs.length < 3) return null;
    const lastRuns = runs.slice(-3).map(r => r.len);
    if (lastRuns.length < 3) return null;
    if (lastRuns[2] > lastRuns[1] && lastRuns[1] > lastRuns[0] && lastRuns[2] >= 3) {
        return history.at(-1).tx;
    }
    if (lastRuns[2] < lastRuns[1] && lastRuns[1] < lastRuns[0] && lastRuns[0] >= 3) {
        return history.at(-1).tx === 'T' ? 'X' : 'T';
    }
    return null;
}

function algoF_windowSimilarity(history) {
    const tx = history.map(h => h.tx);
    const win = 6;
    if (tx.length < win * 2 + 1) return null;
    const target = tx.slice(-win).join('');
    let best = {
        score: -1,
        next: null,
        counts: {
            T: 0,
            X: 0
        }
    };
    for (let i = 0; i <= tx.length - win - 1 - win; i++) {
        const w = tx.slice(i, i + win).join('');
        const score = similarity(w, target);
        if (score > 0.7) {
            best.counts[tx[i + win]]++;
        }
    }
    if (best.counts.T === best.counts.X) return null;
    return best.counts.T > best.counts.X ? 'T' : 'X';
}

function algoG_fibonacciPattern(history) {
    const tx = history.map(h => h.tx);
    const fib = [1, 2, 3, 5, 8];
    for (const n of fib) {
        if (tx.length < n * 2 + 1) continue;
        const pat1 = tx.slice(-n).join('');
        const pat2 = tx.slice(-2 * n, -n).join('');
        if (pat1 === pat2) {
            return tx.at(-n);
        }
    }
    return null;
}

function algoH_lastDiceTotal(history) {
    const lastTotal = history.at(-1)?.total;
    if (!lastTotal) return null;
    if (lastTotal % 2 === 0) {
        return lastTotal >= 11 ? 'X' : 'T';
    } else {
        return lastTotal >= 11 ? 'T' : 'X';
    }
}

function algoI_runLengthDistribution(history) {
    const runs = extractFeatures(history).runs;
    if (runs.length < 8) return null;
    const lastRun = runs.at(-1);
    const avgRun = avg(runs.slice(0, -1).map(r => r.len));
    if (lastRun.len > avgRun * 1.5 && lastRun.len >= 3) {
        return lastRun.val === 'T' ? 'X' : 'T';
    }
    return null;
}

function algoJ_statisticalAnomalies(history) {
    const tx = history.map(h => h.tx);
    const freq = extractFeatures(history).freq;
    const total = tx.length;
    if (total < 50) return null;
    if ((freq['T'] / total) > 0.60) return 'X';
    if ((freq['X'] / total) > 0.60) return 'T';
    return null;
}

function algoK_NgramPlus(history) {
    const tx = history.map(h => h.tx);
    const k = 5;
    if (tx.length < k + 1) return null;
    const lastGram = tx.slice(-k).join('');
    let counts = {
        T: 0,
        X: 0
    };
    for (let i = 0; i < tx.length - k; i++) {
        const gram = tx.slice(i, i + k).join('');
        if (gram === lastGram) {
            counts[tx[i + k]]++;
        }
    }
    if (counts.T === 0 && counts.X === 0) return null;
    if (counts.T === counts.X) return null;
    return counts.T > counts.X ? 'T' : 'X';
}

function algoL_PatternMatchingDynamic(history) {
    const tx = history.map(h => h.tx);
    const len = tx.length;
    if (len < 10) return null;
    const lastPattern = tx.slice(-5).join('');
    let predictions = [];
    for (let i = 0; i <= len - 6; i++) {
        const pattern = tx.slice(i, i + 5).join('');
        if (pattern === lastPattern) {
            predictions.push(tx[i + 5]);
        }
    }
    if (predictions.length > 0) {
        const freq = predictions.reduce((a, v) => {
            a[v] = (a[v] || 0) + 1;
            return a;
        }, {});
        return freq['T'] > freq['X'] ? 'T' : (freq['X'] > freq['T'] ? 'X' : null);
    }
    return null;
}

function algoM_RecentBias(history) {
    const tx = history.map(h => h.tx);
    const recentHistory = lastN(tx, 8);
    const freq = recentHistory.reduce((a, v) => {
        a[v] = (a[v] || 0) + 1;
        return a;
    }, {});
    if (freq['T'] > freq['X'] + 3) return 'X';
    if (freq['X'] > freq['T'] + 3) return 'T';
    return null;
}

function algoN_MartingaleReversal(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 5) return null;
    const last5 = tx.slice(-5);
    const uniqueCount = unique(last5).length;
    if (uniqueCount === 1) {
        return last5[0] === 'T' ? 'X' : 'T';
    }
    return null;
}

function algoO_AdaptiveNgram(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 10) return null;
    let bestPred = null;
    let maxCount = -1;

    for (let k = 3; k <= 6; k++) {
        if (tx.length < k + 1) continue;
        const lastGram = tx.slice(-k).join('');
        let counts = {
            T: 0,
            X: 0
        };

        for (let i = 0; i < tx.length - k; i++) {
            const gram = tx.slice(i, i + k).join('');
            if (gram === lastGram) {
                counts[tx[i + k]]++;
            }
        }

        if (counts.T !== counts.X) {
            const currentMax = Math.max(counts.T, counts.X);
            if (currentMax > maxCount) {
                maxCount = currentMax;
                bestPred = counts.T > counts.X ? 'T' : 'X';
            }
        }
    }
    return bestPred;
}

function algoP_MeanReversion(history) {
    const totals = history.map(h => h.total);
    if (totals.length < 10) return null;
    const features = extractFeatures(history);
    const lastTotal = totals.at(-1);
    const mean = features.meanTotal;
    const std = features.stdTotal;

    if (std === 0) return null;

    if (lastTotal > mean + 1.5 * std && lastTotal >= 13) {
        return 'X';
    }

    if (lastTotal < mean - 1.5 * std && lastTotal <= 8) {
        return 'T';
    }
    return null;
}

function algoQ_SymmetryReversal(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 7) return null;
    const pat5 = tx.slice(-5);
    if (pat5.length === 5 && pat5[0] === pat5[4] && pat5[1] === pat5[2] && pat5[2] === pat5[3] && pat5[0] !== pat5[1]) {
        return pat5[4] === 'T' ? 'X' : 'T';
    }

    const pat5_2 = tx.slice(-5);
    if (pat5_2.length === 5 && pat5_2[0] === pat5_2[1] && pat5_2[2] === pat5_2[3] && pat5_2[3] === pat5_2[4] && pat5_2[0] !== pat5_2[2]) {
        return pat5_2.at(-1) === 'T' ? 'X' : 'T';
    }

    return null;
}

function algoR_StatisticalPersistence(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 30) return null;
    const features = extractFeatures(history);
    const total = tx.length;
    const last = tx.at(-1);
    const lastFreq = (features.freq[last] || 0) / total;

    if (lastFreq < 0.45) {
        return last;
    }

    return null;
}

// 🆕 THUẬT TOÁN MỚI: AI THEO CẦU THÔNG MINH
function algoS_followPattern(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 6) return null;
    const lastRun = extractFeatures(history).runs.at(-1);
    const len = lastRun.len;

    // Các mẫu phổ biến: Bệt (3-4 lần), Xen kẽ 1-1
    if (len === 1 && tx.at(-2) !== tx.at(-1)) { // T X T X (Cầu 1-1)
        return tx.at(-2); // Dự đoán T (theo cầu 1-1)
    }
    if (len === 2 && tx.at(-3) === tx.at(-4) && tx.at(-3) !== tx.at(-5)) { // X X T T X X (Cầu 2-2)
        return tx.at(-1); // Dự đoán X (theo cầu 2-2)
    }
    if (len === 3 && tx.at(-4) === tx.at(-5) && tx.at(-4) !== tx.at(-6)) { // X X X T T T X X X (Cầu 3-3)
        return tx.at(-1); // Dự đoán X (theo cầu 3-3)
    }

    // Nếu đang bệt (chạy từ 3-5 lần), dự đoán tiếp tục bệt
    if (len >= 3 && len <= 5) {
        return lastRun.val;
    }

    return null;
}

// 🆕 THUẬT TOÁN MỚI: AI BẺ CẦU THÔNG MINH
function algoT_breakPattern(history) {
    const tx = history.map(h => h.tx);
    if (tx.length < 7) return null;
    const lastRun = extractFeatures(history).runs.at(-1);
    const len = lastRun.len;

    // Bẻ cầu bệt dài (>= 6 lần)
    if (len >= 6) {
        return lastRun.val === 'T' ? 'X' : 'T';
    }
    
    // Bẻ cầu 1-1 dài (>= 7 lần xen kẽ)
    const tx7 = tx.slice(-7);
    if (tx7.length === 7) {
        let isAlt = true;
        for(let i = 0; i < 6; i++) {
            if(tx7[i] === tx7[i+1]) {
                isAlt = false;
                break;
            }
        }
        if (isAlt) {
            return tx.at(-1) === 'T' ? 'X' : 'T';
        }
    }

    return null;
}

// ====================== DANH SÁCH THUẬT TOÁN ĐẦY ĐỦ (29 Algoriths) ======================
const ALL_ALGS = [{
    id: 'algo1_cycle3',
    fn: algo1_cycle3
}, {
    id: 'algo2_alternate2',
    fn: algo2_alternate2
}, {
    id: 'algo3_threeRepeat',
    fn: algo3_threeRepeat
}, {
    id: 'algo4_double2pattern',
    fn: algo4_double2pattern
}, {
    id: 'algo5_freqRebalance',
    fn: algo5_freqRebalance
}, {
    id: 'algo6_longRunReversal',
    fn: algo6_longRunReversal
}, {
    id: 'algo7_threePatternReversal',
    fn: algo7_threePatternReversal
}, {
    id: 'algo9_twoOneSwitch',
    fn: algo9_twoOneSwitch
}, {
    id: 'algo10_newSequenceFollow',
    fn: algo10_newSequenceFollow
}, {
    id: 'A_markov',
    fn: algoA_markov
}, {
    id: 'B_ngram',
    fn: algoB_ngram
}, {
    id: 'C_entropy',
    fn: algoC_entropy
}, {
    id: 'D_dice',
    fn: algoD_dicePattern
}, {
    id: 'E_runmom',
    fn: algoE_runMomentum
}, {
    id: 'F_window',
    fn: algoF_windowSimilarity
}, {
    id: 'G_fibonacci',
    fn: algoG_fibonacciPattern
}, {
    id: 'H_diceTotal',
    fn: algoH_lastDiceTotal
}, {
    id: 'I_runDist',
    fn: algoI_runLengthDistribution
}, {
    id: 'J_anomalies',
    fn: algoJ_statisticalAnomalies
}, {
    id: 'K_NgramPlus',
    fn: algoK_NgramPlus
}, {
    id: 'L_PatternMatchingDynamic',
    fn: algoL_PatternMatchingDynamic
}, {
    id: 'M_RecentBias',
    fn: algoM_RecentBias
}, {
    id: 'N_MartingaleReversal',
    fn: algoN_MartingaleReversal
}, {
    id: 'O_AdaptiveNgram',
    fn: algoO_AdaptiveNgram
}, {
    id: 'P_MeanReversion',
    fn: algoP_MeanReversion
}, {
    id: 'Q_SymmetryReversal',
    fn: algoQ_SymmetryReversal
}, {
    id: 'R_Persistence',
    fn: algoR_StatisticalPersistence
}, {
    id: 'S_followPattern', // 🆕 Thuật toán theo cầu
    fn: algoS_followPattern
}, {
    id: 'T_breakPattern', // 🆕 Thuật toán bẻ cầu
    fn: algoT_breakPattern
}];
// ====================== ENSEMBLE CLASSIFIER (Hệ thống trọng số TỰ TỐI ƯU LỢI NHUẬN) ======================
class SEIUEnsemble {
    constructor(algorithms, opts = {}) {
        this.algs = algorithms;
        this.weights = {};
        // TỐI ƯU: Tăng độ nhạy (responsive) của việc điều chỉnh trọng số
        this.emaAlpha = opts.emaAlpha ?? 0.1;
        this.minWeight = opts.minWeight ?? 0.001;
        this.historyWindow = opts.historyWindow ?? 500;
        for (const a of algorithms) this.weights[a.id] = 1;
    }

    fitInitial(history) {
        const window = lastN(history, this.historyWindow);
        if (window.length < 10) return;
        const algScores = {};
        for (const a of this.algs) algScores[a.id] = 0;

        for (let i = 3; i < window.length; i++) {
            const prefix = window.slice(0, i);
            const actual = window[i].tx;
            for (const a of this.algs) {
                const pred = a.fn(prefix);
                if (pred && pred === actual) algScores[a.id]++;
            }
        }

        let total = 0;
        for (const id in algScores) {
            const w = (algScores[id] || 0) + 1;
            this.weights[id] = w;
            total += w;
        }
        for (const id in this.weights) this.weights[id] = Math.max(this.minWeight, this.weights[id] / total);

        console.log(`⚖️ Đã khởi tạo ${Object.keys(this.weights).length} trọng số. Tổng: ${total.toFixed(0)}`);
    }

    updateWithOutcome(historyPrefix, actualTx) {
        let totalWeightChange = 0;
        for (const a of this.algs) {
            const pred = a.fn(historyPrefix);
            const correct = pred === actualTx ? 1 : 0;
            const currentWeight = this.weights[a.id] || this.minWeight;

            // TỐI ƯU TỶ LỆ THẮNG (Mạnh hơn): Thưởng 10% nếu đúng, Phạt 10% nếu sai
            const reward = correct ? 1.1 : 0.9;
            const targetWeight = currentWeight * reward;

            const nw = this.emaAlpha * targetWeight + (1 - this.emaAlpha) * currentWeight;

            this.weights[a.id] = Math.max(this.minWeight, nw);
            totalWeightChange += nw;
        }

        const s = Object.values(this.weights).reduce((a, b) => a + b, 0) || 1;
        for (const id in this.weights) this.weights[id] /= s;
    }

    predict(history) {
        const votes = {};
        for (const a of this.algs) {
            const pred = a.fn(history);
            if (!pred) continue;
            votes[pred] = (votes[pred] || 0) + (this.weights[a.id] || 0);
        }

        if (!votes['T'] && !votes['X']) {
            const fallback = algo5_freqRebalance(history) || 'T';
            return {
                prediction: fallback === 'T' ? 'Tài' : 'Xỉu',
                confidence: 0.5,
                votes,
                rawPrediction: fallback
            };
        }

        const {
            key: best,
            val: bestVal
        } = majority(votes);
        const total = Object.values(votes).reduce((a, b) => a + b, 0);
        const confidence = Math.min(0.99, Math.max(0.51, total > 0 ? bestVal / total : 0.51));

        return {
            prediction: best === 'T' ? 'Tài' : 'Xỉu',
            confidence,
            votes,
            rawPrediction: best
        };
    }
}

// ====================== MANAGER CLASS ======================
class SEIUManager {
    constructor(opts = {}) {
        this.history = [];
        this.ensemble = new SEIUEnsemble(ALL_ALGS, {
            emaAlpha: opts.emaAlpha ?? 0.1,
            historyWindow: opts.historyWindow ?? 500
        });
        this.warm = false;
        this.currentPrediction = null;
    }

    loadInitial(lines) {
        this.history = parseLines(lines);
        this.ensemble.fitInitial(this.history);
        this.warm = true;

        this.currentPrediction = this.getPrediction();

        console.log("📦 Đã tải lịch sử các phiên gần nhất. Hệ thống đã sẵn sàng dự đoán.");
        const nextSession = this.history.at(-1) ? this.history.at(-1).session + 1 : 'N/A';
        console.log(`🔮 Dự đoán phiên tiếp theo (${nextSession}): ${this.currentPrediction.prediction} (Tỷ lệ: ${(this.currentPrediction.confidence * 100).toFixed(0)}%)`);
    }

    pushRecord(record) {
        const parsed = {
            session: record.session,
            dice: record.dice,
            total: record.total,
            result: record.result,
            tx: record.total >= 11 ? 'T' : 'X'
        };

        if (this.currentPrediction) {
            const actualResult = parsed.tx;
            const predictionText = this.currentPrediction.rawPrediction === 'T' ? 'Tài' : 'Xỉu';

            if (this.currentPrediction.rawPrediction === actualResult) {
                // FIX: Cập nhật biến global predictionStats
                predictionStats.totalCorrect++; 
                console.log(`🚀 Phiên ${parsed.session}: ĐÚNG (${predictionText} - ${actualResult}). Tỷ lệ: ${(predictionStats.totalCorrect / (predictionStats.totalCorrect + predictionStats.totalIncorrect) * 100).toFixed(2)}%`);
            } else {
                // FIX: Cập nhật biến global predictionStats
                predictionStats.totalIncorrect++; 
                console.log(`❌ Phiên ${parsed.session}: SAI (${predictionText} - ${actualResult}). Tỷ lệ: ${(predictionStats.totalCorrect / (predictionStats.totalCorrect + predictionStats.totalIncorrect) * 100).toFixed(2)}%`);
            }
        }

        const prefix = this.history.slice();
        if (prefix.length >= 3) {
            // Cập nhật trọng số theo kết quả thực tế
            this.ensemble.updateWithOutcome(prefix, parsed.tx);
        }

        this.history.push(parsed);

        this.currentPrediction = this.getPrediction();
        console.log(`◀️ Phiên mới ${parsed.session} → ${parsed.result}. Dự đoán phiên ${parsed.session + 1} là: ${this.currentPrediction.prediction} (Tỷ lệ: ${(this.currentPrediction.confidence * 100).toFixed(0)}%)`);
    }

    getPrediction() {
        return this.ensemble.predict(this.history);
    }
}

const seiuManager = new SEIUManager();

// ====================== BIẾN GLOBAL VÀ CẤU HÌNH WS (GIỮ NGUYÊN TOKEN/TÀI KHOẢN) ======================
// Giữ nguyên token và tài khoản theo yêu cầu
const WS_URL = "wss://websocket.azhkthg1.net/websocket?token=";
const TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJnZW5kZXIiOjAsImNhblZpZXdTdGF0IjpmYWxzZSwiZGlzcGxheU5hbWUiOiJzc2NoaWNobWVtIiwiYm90IjowLCJpc01lcmNoYW50IjpmYWxzZSwidmVyaWZpZWRCYW5rQWNjb3VudCI6ZmFsc2UsInBsYXlFdmVudExvYmJ5IjpmYWxzZSwiY3VzdG9tZXJJZCI6MzI2OTA1OTg1LCJhZmZJZCI6InN1bndpbiIsImJhbm5lZCI6ZmFsc2UsImJyYW5kIjoic3VuLndpbiIsInRpbWVzdGFtcCI6MTc2NDMzNTk1OTAyOCwibG9ja0dhbWVzIjpbXSwiYW1vdW50IjowLCJsb2NrQ2hhdCI6ZmFsc2UsInBob25lVmVyaWZpZWQiOmZhbHNlLCJpcEFkZHJlc3MiOiIyNDAyOjgwMDo2ZjVmOmNiYzU6OGE0Njo2MTQ4OmViN2Y6Yjc2NSIsIm11dGUiOmZhbHNlLCJhdmF0YXIiOiJodHRwczovL2ltYWdlcy5zd2luc2hvcC5uZXQvaW1hZ2VzL2F2YXRhci9hdmF0YXJfMTQucG5nIiwicGxhdGZvcm1JZCI6MiwidXNlcklkIjoiOWQyMTliNGYtMjQxYS00ZmU2LTkyNDItMDQ5MWYxYzRhMDVjIiwicmVnVGltZSI6MTc2MzcyNzkwNzk0MCwicGhvbmUiOiIiLCJkZXBvc2l0IjpmYWxzZSwidXNlcm5hbWUiOiJTQ19naWF0aGluaDIxMzMifQ.OLUoOSPUjq4C46bfqpkq8NrJIqc1HTAgcXhLkQAlc-o"
let rikResults = [];
let rikCurrentSession = null;
let rikWS = null;
let rikIntervalCmd = null;

const predictionStats = {
    totalCorrect: 0,
    totalIncorrect: 0,
    lastPrediction: null
};
import fastify from "fastify";
import cors from "@fastify/cors";
import WebSocket from "ws";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import fetch from "node-fetch";

// FIX: Đảm bảo tất cả các hàm và biến từ Phần 1 & 2 được bao gồm ở đây
// ***************************************************************
// VUI LÒNG ĐẢM BẢO CÁC CODE TỪ PHẦN 1 VÀ PHẦN 2 ĐƯỢC ĐẶT TRÊN PHẦN NÀY KHI CHẠY
// ***************************************************************

const app = fastify({ logger: true });

await app.register(cors, { origin: "*" });

// 🛠️ CẤU HÌNH SERVER ỔN ĐỊNH: Ưu tiên PORT từ biến môi trường (cho Render/Cloud)
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ====================== ENDPOINT API (ĐÃ TỐI ƯU THEO YÊU CẦU) ======================
app.get("/api/taixiu/sunwin", async () => {
  const valid = rikResults.filter((r) => r.dice?.length === 3);
  const totalPredict =
    predictionStats.totalCorrect + predictionStats.totalIncorrect;
  const correctRate =
    totalPredict > 0
      ? (predictionStats.totalCorrect / totalPredict) * 100
      : 0;

  if (!valid.length) {
    return {
      id: "@nggiathinhh01",
      thong_bao: "Hệ thống đang tải dữ liệu lịch sử ban đầu, vui lòng chờ 30 giây.",
      trang_thai_du_lieu: "CHUA_SAN_SANG",
      thong_ke_hieu_suat_he_thong: {
        tong_so_lan_du_doan: totalPredict,
        tong_lan_thang: predictionStats.totalCorrect,
        tong_lan_thua: predictionStats.totalIncorrect,
        ty_le_thang: `${correctRate.toFixed(2)}%`,
      },
      // Chuyển 'Tài'/'Xỉu' sang chữ thường
      du_doan_moi_nhat: seiuManager.currentPrediction
        ? {
            phien_du_doan: valid.at(0)?.session + 1 || "N/A",
            du_doan: seiuManager.currentPrediction.prediction.toLowerCase(),
            ty_le_thanh_cong_du_doan: `${(
              seiuManager.currentPrediction.confidence * 100
            ).toFixed(0)}%`,
          }
        : null,
    };
  }

  const current = valid[0];
  const { session, dice, total, result } = current;
  const prediction = seiuManager.getPrediction();

  // LOGIC TẠO CHUỖI PANTER (50 phiên gần nhất) - CHUYỂN SANG CHỮ THƯỜNG
  const historyPattern = valid
      .map(item => item.result === 'Tài' ? 't' : 'x')
      .reverse()
      .join('')
      .slice(-50);

  const phienHienTai = session + 1;

  // CẤU TRÚC JSON CUỐI CÙNG
  return {
    id: "@nggiathinhh01",

    // PHIÊN TRƯỚC
    phien_truoc: session,
    xuc_xac1: dice[0],
    xuc_xac2: dice[1],
    xuc_xac3: dice[2],
    tong: total,
    ket_qua: result.toLowerCase(), // 'tài' hoặc 'xỉu'

    // DỰ ĐOÁN
    phien_hien_ai: phienHienTai,
    du_doan: prediction.prediction.toLowerCase(), // 'tài' hoặc 'xỉu'

    // LỊCH SỬ
    Panter: historyPattern, // Đã chuyển sang chữ thường

    // THỐNG KÊ CHI TIẾT
    ty_le_thanh_cong_du_doan: `${(prediction.confidence * 100).toFixed(0)}%`,
    thong_ke_hieu_suat_he_thong: {
      tong_so_lan_du_doan: totalPredict, // FIX: Đã lấy từ predictionStats
      tong_lan_thang: predictionStats.totalCorrect, // FIX: Đã lấy từ predictionStats
      tong_lan_thua: predictionStats.totalIncorrect, // FIX: Đã lấy từ predictionStats
      ty_le_thang: `${correctRate.toFixed(2)}%`, // FIX: Đã tính toán chính xác
    },
    // Đã loại bỏ 'giai_thich' và 'trong_so_cac_thuat_toan' theo yêu cầu
  };
});

app.get("/api/taixiu/history", async () => {
  const valid = rikResults.filter((r) => r.dice?.length === 3);
  if (!valid.length) return { message: "Không có dữ liệu lịch sử." };
  return valid.map((i) => ({
    session: i.session,
    dice: i.dice,
    total: i.total,
    result: i.result,
    tx_label: i.total >= 11 ? "T" : "X",
  }));
});

app.get("/api/taixiu/stats", async () => {
  const total =
    predictionStats.totalCorrect + predictionStats.totalIncorrect;
  const correctRate =
    total > 0 ? (predictionStats.totalCorrect / total) * 100 : 0;
  return {
    totalCorrect: predictionStats.totalCorrect,
    totalIncorrect: predictionStats.totalIncorrect,
    totalSessions: total,
    correctRate: `${correctRate.toFixed(2)}%`,
  };
});

app.get("/", async () => {
  return { status: "ok", msg: "Server chạy thành công 🚀" };
});

// ====================== KHỞI ĐỘNG SERVER ======================
const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
  } catch (err) {
    const fs = await import("node:fs");
    const logFile = path.join(__dirname, "server-error.log");
    const errorMsg = `
================= SERVER ERROR =================
Time: ${new Date().toISOString()}
Error: ${err.message}
Stack: ${err.stack}
Port: ${PORT}
Host: 0.0.0.0
=================================================
`;
    console.error(errorMsg);
    fs.writeFileSync(logFile, errorMsg, { encoding: "utf8", flag: "a+" });
    process.exit(1);
  }

  let publicIP = "0.0.0.0";
  try {
    const res = await fetch("https://ifconfig.me/ip");
    publicIP = (await res.text()).trim();
  } catch (e) {
    console.error("❌ Lỗi lấy public IP:", e.message);
  }

  console.log("\n🚀 Server đã chạy thành công!");
  console.log(`   ➜ Local:   http://localhost:${PORT}/`);
  console.log(`   ➜ Network: http://${publicIP}:${PORT}/\n`);

  console.log("📌 Các API endpoints:");
  console.log(
    `   ➜ GET /api/taixiu/sunwin   → http://${publicIP}:${PORT}/api/taixiu/sunwin`
  );
};

start();

// ====================== WEBSOCKET LOGIC (Đã tối ưu ổn định) ======================
function decodeBinaryMessage(data) {
    try {
        const message = new TextDecoder().decode(data);
        if (message.startsWith("[") || message.startsWith("{")) {
            return JSON.parse(message);
        }
        return null;
    } catch {
        return null;
    }
}

function sendRikCmd1005() {
    if (rikWS?.readyState === WebSocket.OPEN) {
        // Gửi lệnh để duy trì kết nối và nhận thông tin cược
        rikWS.send(JSON.stringify([6, "MiniGame", "taixiuPlugin", {
            cmd: 1005
        }]));
    }
}

function connectRikWebSocket() {
    console.log("🔌 Đang kết nối đến WebSocket...");
    rikWS = new WebSocket(`${WS_URL}${TOKEN}`);

    rikWS.on("open", () => {
        console.log("✅ Kết nối WebSocket thành công. Đang gửi gói tin xác thực.");
        const authPayload = [
            1,
            "MiniGame",
            "SC_giathinh2133", // GIỮ NGUYÊN TÊN TÀI KHOẢN
            "thinh211", // GIỮ NGUYÊN MẬT KHẨU
            {
                info: JSON.stringify({
                    ipAddress: "2402:800:62cd:b4d1:8c64:a3c9:12bf:c19a",
                    wsToken: TOKEN,
                    userId: "cdbaf598-e4ef-47f8-b4a6-a4881098db86",
                    username: "SC_hellokietne212",
                    timestamp: Date.now(),
                }),
                signature:
                    "473ABDDDA6BDD74D8F0B6036223B0E3A002A518203A9BB9F95AD763E3BF969EC2CBBA61ED1A3A9E217B52A4055658D7BEA38F89B806285974C7F3F62A9400066709B4746585887D00C9796552671894F826E69EFD234F6778A5DDC24830CEF68D51217EF047644E0B0EB1CB26942EB34AEF114AEC36A6DF833BB10F7D122EA5E",
                pid: 5,
                subi: true,
            },
        ];
        rikWS.send(JSON.stringify(authPayload));
        // Thiết lập Interval gửi lệnh duy trì kết nối (heartbeat)
        clearInterval(rikIntervalCmd);
        rikIntervalCmd = setInterval(sendRikCmd1005, 5000);
    });

    rikWS.on("message", (data) => {
        try {
            const json =
                typeof data === "string" ? JSON.parse(data) : decodeBinaryMessage(data);
            if (!json) return;

            // Xử lý kết quả từng phiên mới
            if (
                typeof json === "object" &&
                json !== null &&
                json.session &&
                Array.isArray(json.dice)
            ) {
                const record = {
                    session: json.session,
                    dice: json.dice,
                    total: json.total,
                    result: json.result,
                };
                // SỬ DỤNG SEIUMANAGER ĐỂ ĐẨY RECORD VÀ CẬP NHẬT THỐNG KÊ
                seiuManager.pushRecord(record); 
                if (!rikCurrentSession || record.session > rikCurrentSession) {
                    rikCurrentSession = record.session;
                    rikResults.unshift(record);
                    if (rikResults.length > 200) rikResults.pop();
                }
            }
            // Xử lý tải lịch sử ban đầu (htr)
            else if (Array.isArray(json) && json[1]?.htr) {
                const newHistory = json[1].htr
                    .map((i) => ({
                        session: i.sid,
                        dice: [i.d1, i.d2, i.d3],
                        total: i.d1 + i.d2 + i.d3,
                        result: i.d1 + i.d2 + i.d3 >= 11 ? "Tài" : "Xỉu",
                    }))
                    .sort((a, b) => b.session - a.session);

                seiuManager.loadInitial(newHistory);
                rikResults = newHistory.slice(0, 200);
            }
        } catch (e) {
            console.error("❌ Parse error:", e.message);
        }
    });

    rikWS.on("close", () => {
        console.log("🔌 WebSocket ngắt kết nối. Đang kết nối lại sau 5s...");
        clearInterval(rikIntervalCmd);
        setTimeout(connectRikWebSocket, 5000); // Tự động kết nối lại sau 5 giây
    });

    rikWS.on("error", (err) => {
        console.error("🔌 WebSocket error. Đóng kết nối:", err.message);
        // Đóng kết nối để kích hoạt sự kiện 'close' và tự động kết nối lại
        rikWS.close();
    });
}

connectRikWebSocket();

