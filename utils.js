// utils.js

const numMap = {
    "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
    "13": "thirteen", "20": "twenty", "27": "twenty-seven", "50": "fifty",
    "100": "one hundred", "435": "four hundred thirty-five"
};

function clean(str) {
    if (!str) return "";
    // 특수기호 제거, 영문/숫자/공백만 유지 (오타 검증을 위해)
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function checkIsCorrect(user, real, questionText) {
    if (!user) return false;
    
    const uClean = clean(user);
    const qLower = questionText.toLowerCase();

    // 1. [핵심 수정] 질문이 대놓고 복수를 요구할 때만 목표 개수를 올림!
    // "Why?"가 들어간 문장은 무조건 1개로 처리됨.
    let required = 1;
    if (qLower.match(/\b(name|what are|give|which)\s+(the\s+)?three\b/i)) {
        required = 3;
    } else if (qLower.match(/\b(name|what are|give|which)\s+(the\s+)?two\b/i)) {
        required = 2;
    }

    const sets = real.split('|');

    return sets.some(set => {
        let options = set.split('/').map(o => o.trim());
        
        // 2. "Senate and House" 처럼 하나의 보기로 제공되었는데 2개를 요구하는 경우 분리
        if (options.length < required) {
            let subOptions = [];
            options.forEach(opt => {
                subOptions.push(...opt.split(/,|\band\b/i).map(s => s.trim()).filter(s => s.length > 0));
            });
            options = subOptions;
        }

        // 3. 괄호 분리 및 후보군 생성
        let candidates = [];
        options.forEach(opt => {
            let text = opt.toLowerCase();
            if (text.includes('(')) {
                let main = text.replace(/\([^)]*\)/g, "").trim();
                let inside = text.match(/\(([^)]+)\)/)[1].trim();
                let full = text.replace(/[()]/g, "").trim();
                candidates.push(clean(main), clean(inside), clean(full));
            } else {
                candidates.push(clean(text));
            }
        });

        // 4. "the", "a", "an" 관사를 뺀 버전도 후보에 추가하여 유연성 극대화
        let finalCandidates = [];
        candidates.filter(c => c.length > 0).forEach(c => {
            finalCandidates.push(c);
            let noArticle = c.replace(/^(the|a|an)\s+/, "").trim();
            if (noArticle !== c && noArticle.length > 1) {
                finalCandidates.push(noArticle);
            }
        });
        
        // 긴 문장부터 확인하기 위해 정렬
        finalCandidates = [...new Set(finalCandidates)].sort((a, b) => b.length - a.length);

        // [빠른 통과] 1개만 요구할 때 내 답안이 정답 리스트에 완벽히 있으면 즉시 합격!
        if (required === 1 && finalCandidates.includes(uClean)) return true;

        let found = 0;
        let tempUser = uClean;
        let matched = new Set();

        // 5. [핵심 수정] 부분 일치는 오직 '내 답안 안에 핵심 정답이 들어있는지'만 검사! (꼼수 차단)
        finalCandidates.forEach(cand => {
            if (tempUser.includes(cand)) {
                if (!matched.has(cand)) {
                    found++;
                    matched.add(cand);
                    tempUser = tempUser.replace(cand, " "); // 중복 카운트 방지
                }
            }
        });

        // 6. 숫자-영단어 호환 검사
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

// 오디오 & TTS 함수 (유지)
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
