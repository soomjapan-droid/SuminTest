// utils.js

const numMap = {
    "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
    "13": "thirteen", "20": "twenty", "27": "twenty-seven", "50": "fifty",
    "100": "one hundred", "435": "four hundred thirty-five"
};

function clean(str) {
    if (!str) return "";
    // [핵심] 알파벳, 숫자, 기본 공백을 제외한 '모든' 기호와 보이지 않는 유령 문자 완벽 제거
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function checkIsCorrect(user, real, questionText) {
    if (!user) return false;
    
    const uClean = clean(user);
    const qLower = questionText.toLowerCase();

    // 1. 필요한 정답 개수 정확히 파악 (기본은 무조건 1개)
    let required = 1;
    if (qLower.includes("three")) required = 3;
    else if (qLower.includes("two") && !qLower.includes("one")) required = 2;

    const sets = real.split('|');

    return sets.some(set => {
        let options = set.split('/');
        
        // 2. 세트 내 복수 정답 분리 (예: 16번 문제 대응)
        if (options.length < required) {
            let subOptions = [];
            options.forEach(opt => {
                subOptions.push(...opt.split(/[,]| and /));
            });
            options = subOptions;
        }

        // 3. 괄호 분리 및 후보군 생성
        let candidates = [];
        options.forEach(opt => {
            let text = opt.toLowerCase();
            if (text.includes('(')) {
                candidates.push( clean(text.replace(/\([^)]*\)/g, "")) );
                candidates.push( clean(text.match(/\(([^)]+)\)/)[1]) );
                candidates.push( clean(text.replace(/[()]/g, "")) );
            } else {
                candidates.push( clean(text) );
            }
        });

        let finalCandidates = candidates.filter(c => c.length > 0);
        
        // [필살기] 요구 개수가 1개일 때, 완벽히 똑같이 쳤으면 무조건 통과!
        if (required === 1 && finalCandidates.includes(uClean)) return true;

        let found = 0;
        let tempUser = uClean;
        let matched = new Set();

        // 4. 부분 일치 검사 (오타 및 긴 문장 방어용)
        finalCandidates.sort((a, b) => b.length - a.length).forEach(cand => {
            // 내가 쓴 답에 정답이 포함되어 있거나, 정답 뭉치에 내가 쓴 답이 포함되어 있을 때
            if (tempUser.includes(cand) || (cand.includes(tempUser) && tempUser.length >= 4)) {
                if (!matched.has(cand)) {
                    found++;
                    matched.add(cand);
                    tempUser = tempUser.replace(cand, " ");
                }
            }
        });

        // 5. 숫자 교차 검증 (27 vs twenty-seven)
        if (found < required) {
            for (let [num, word] of Object.entries(numMap)) {
                if ((uClean.includes(num) || uClean.includes(word)) && 
                    finalCandidates.some(c => c.includes(num) || c.includes(word))) {
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