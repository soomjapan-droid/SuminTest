// utils.js

const numMap = {
    "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
    "13": "thirteen", "20": "twenty", "27": "twenty-seven", "50": "fifty",
    "100": "one hundred", "435": "four hundred thirty-five"
};

// 함수 이름은 유지하되, 내부 로직을 관사/전치사 제거 방식으로 강화
function clean(str) {
    if (!str) return "";
    return str.toLowerCase()
        .replace(/[.,!?;:]/g, "") // 문장부호 제거
        .replace(/\b(the|a|an|is|are|of|to|and|in|at)\b/g, "") // 채점에 방해되는 관사/전치사 제거
        .replace(/\s+/g, " ") // 중복 공백 제거
        .trim();
}

function checkIsCorrect(user, real, questionText) {
    if (!user) return false;
    
    const uClean = clean(user); // 이제 여기서 강화된 로직이 작동합니다.
    const qLower = questionText.toLowerCase();

    // 1. 세트 분리 (|)
    const sets = real.split('|').map(s => s.trim());

    return sets.some(set => {
        // 2. 개별 정답 후보 분리 (/)
        let targets = set.split('/').map(t => t.trim());
        
        // 3. 괄호 처리 포함 후보군 생성
        let finalCandidates = [];
        targets.forEach(t => {
            let base = t.toLowerCase().replace(/[.,!?;:]/g, "");
            
            if (base.includes('(')) {
                const main = base.replace(/\([^)]*\)/g, "").trim();
                const bracket = base.match(/\(([^)]+)\)/)[1].trim();
                const full = base.replace(/[()]/g, "").trim();
                finalCandidates.push(main, bracket, full);
            } else {
                finalCandidates.push(base);
            }
        });

        // 4. 요구 정답 개수 파악
        let required = 1;
        if (qLower.includes("three")) required = 3;
        else if (qLower.includes("two")) required = 2;

        let found = 0;
        let tempUser = uClean;
        let matchedTargets = new Set();

        // 5. 핵심 키워드 매칭 (긴 단어 우선)
        const sortedCandidates = [...new Set(finalCandidates)].sort((a, b) => b.length - a.length);

        sortedCandidates.forEach(cand => {
            const candClean = clean(cand); // 후보군도 동일하게 강화된 clean 적용
            if (candClean.length < 1) return;

            // 숫자 호환성 체크 (예: 25번 문제 '2' vs 'two')
            let isNumMatch = false;
            for (let [num, word] of Object.entries(numMap)) {
                if ((uClean.includes(num) || uClean.includes(word)) && 
                    (candClean.includes(num) || candClean.includes(word))) {
                    isNumMatch = true;
                    break;
                }
            }

            // 부분 일치 혹은 숫자 일치 확인
            if (tempUser.includes(candClean) || candClean.includes(tempUser) || isNumMatch) {
                if (!matchedTargets.has(candClean)) {
                    found++;
                    matchedTargets.add(candClean);
                    tempUser = tempUser.replace(candClean, "");
                }
            }
        });

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
    // ID를 3자리 숫자로 변환 (1 -> 001, 10 -> 010)
    const padId = String(id).padStart(3, '0');
    const audio = new Audio(`audio/q${padId}.mp3`);

    if (callback) {
        audio.onended = callback;
    }

    audio.play().catch(e => {
        console.error("Audio file not found:", e);
        // 파일이 없을 경우 기존 TTS로 백업 (선택 사항)
        // speakText("Audio file missing"); 
    });
}