// utils.js

const numMap = {
    "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine", "10": "ten",
    "13": "thirteen", "20": "twenty", "27": "twenty-seven", "50": "fifty",
    "100": "one hundred", "435": "four hundred thirty-five"
};


function clean(str) {
    if (!str) return "";
    // 소문자화 및 불필요한 기호 제거, 괄호 내용 처리 전 단계
    return str.toLowerCase().replace(/[.,!]/g, "").trim();
}

function checkIsCorrect(user, real, questionText) {
    if (!user) return false;
    const userClean = clean(user); // 소문자화 + 기호 제거
    const qLower = questionText.toLowerCase();

    // 1. '|'를 기준으로 서로 다른 '정답 세트'를 분리 (예: 16번 문제)
    const answerSets = real.split('|').map(set => set.trim());

    // 2. 각 세트 중 하나라도 완벽하게 만족하는지 확인 (some)
    return answerSets.some(set => {
        // 세트 내의 개별 키워드들을 분리 (/, 또는 , 기준)
        // 'and'는 채점에 방해되므로 제거
        let keywords = set.split(/[,/]/)
            .map(k => clean(k.replace(/\band\b/g, "")))
            .filter(k => k.length > 1);

        // 괄호 처리: 세트 내 각 키워드에 괄호가 있다면 괄호 밖/안 모두 후보로 등록
        let finalKeywords = [];
        keywords.forEach(kw => {
            if (kw.includes('(')) {
                const mainPart = kw.replace(/\s*\([^)]*\)/g, "").trim();
                const fullPart = kw.replace(/[()]/g, "").trim();
                finalKeywords.push(mainPart, fullPart);
            } else {
                finalKeywords.push(kw);
            }
        });

        // 요구 정답 개수 파악
        let requiredMatch = finalKeywords.length;
        if (qLower.includes("three")) requiredMatch = 3;
        else if (qLower.includes("two")) requiredMatch = 2;

        let matchCount = 0;
        let tempUserAns = userClean;
        let foundForThisSet = [];

        // 긴 단어부터 매칭하여 중복/부분 일치 오류 방지
        const sortedKeywords = [...new Set(finalKeywords)].sort((a, b) => b.length - a.length);

        sortedKeywords.forEach(target => {
            // 사용자가 입력한 문장에 키워드가 포함되어 있는지 확인
            if (tempUserAns.includes(target) && !foundForThisSet.includes(target)) {
                matchCount++;
                foundForThisSet.push(target);
                tempUserAns = tempUserAns.replace(target, " "); // 찾은 단어는 제외
            }
        });

        // 숫자-영단어 변환 체크 (예: 27 vs twenty-seven)
        if (matchCount < requiredMatch) {
            for (let num in numMap) {
                if (userClean.includes(num) || userClean.includes(numMap[num])) {
                    if (sortedKeywords.some(k => k.includes(num) || k.includes(numMap[num]))) {
                        matchCount++;
                    }
                }
            }
        }

        // 현재 검사 중인 '세트'의 조건을 모두 충족해야만 true
        return matchCount >= requiredMatch;
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