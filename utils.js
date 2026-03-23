// utils.js

const numMap = {
    "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
    "13": "thirteen", "20": "twenty", "27": "twenty-seven", "50": "fifty",
    "100": "one hundred", "435": "four hundred thirty-five"
};

function clean(str) {
    if (!str) return "";
    // 특수기호만 제거하고 본래 단어는 그대로 유지
    return str.toLowerCase().replace(/[.,!?;:]/g, "").replace(/\s+/g, " ").trim();
}

function checkIsCorrect(user, real, questionText) {
    if (!user) return false;
    const uClean = clean(user);
    const qLower = questionText.toLowerCase();

    // 1. 질문을 분석하여 '진짜 필요한 정답 개수' 파악
    let required = 1; // 기본은 무조건 1개!
    if (qLower.includes("three")) required = 3;
    else if (qLower.includes("two") && !qLower.includes("one")) required = 2;

    // 2. 세트 분리 (|)
    const sets = real.split('|').map(s => s.trim());

    return sets.some(set => {
        let options = set.split('/').map(t => t.trim());
        
        // [핵심 보완] 16번 문제처럼 "Legislative, executive, and judicial" 이 통째로 1개 옵션인데 
        // 3개를 맞춰야 하는 경우, 이 옵션 자체를 쪼개서 채점합니다.
        if (options.length < required) {
            let subOptions = [];
            options.forEach(opt => {
                subOptions.push(...opt.split(/[,]| and /).map(o => o.trim()).filter(o => o.length > 0));
            });
            options = subOptions;
        }

        // 3. 괄호 안팎 분리하여 모든 경우의 수 생성
        let finalCandidates = [];
        options.forEach(opt => {
            let base = clean(opt);
            if (opt.includes('(')) {
                const main = clean(opt.replace(/\([^)]*\)/g, ""));
                const inside = clean(opt.match(/\(([^)]+)\)/)[1]);
                const full = clean(opt.replace(/[()]/g, ""));
                
                if (main) finalCandidates.push(main);
                if (inside) finalCandidates.push(inside);
                if (full) finalCandidates.push(full);
            } else {
                if (base) finalCandidates.push(base);
            }
        });

        let found = 0;
        let tempUser = uClean;
        let matchedCandidates = new Set();

        // 긴 단어부터 매칭 (부분 일치 꼬임 방지)
        const sortedCandidates = [...new Set(finalCandidates)].sort((a, b) => b.length - a.length);

        sortedCandidates.forEach(cand => {
            if (cand.length === 0) return;

            if (tempUser.includes(cand) || tempUser === cand) {
                if (!matchedCandidates.has(cand)) {
                    found++;
                    matchedCandidates.add(cand);
                    tempUser = tempUser.replace(cand, " "); // 중복 카운트 방지
                }
            }
        });

        // 숫자 호환성 체크 (twenty-seven vs 27)
        if (found < required) {
            for (let [num, word] of Object.entries(numMap)) {
                if ((uClean.includes(num) || uClean.includes(word)) && 
                    sortedCandidates.some(c => c.includes(num) || c.includes(word))) {
                    found++;
                    break;
                }
            }
        }

        return found >= required;
    });
}

function speakText(text, callback) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => (v.name.includes('Siri') || v.name.includes('Google')) && v.lang.includes('en-US'));
    if (premiumVoice) u.voice = premiumVoice;
    u.lang = 'en-US';
    u.rate = 0.85;
    u.onend = () => { if(callback) callback(); };
    window.speechSynthesis.speak(u);
}

function playQuestionAudio(id, callback) {
    const padId = String(id).padStart(3, '0');
    const audio = new Audio(`audio/q${padId}.mp3`);
    if (callback) audio.onended = callback;
    audio.play().catch(e => console.error("Audio missing:", e));
}