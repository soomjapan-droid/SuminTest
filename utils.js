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

    const userClean = clean(user).replace(/[()]/g, "");
    const qLower = questionText.toLowerCase();

    // 1. '/'로 정답 뭉치 분리 및 각 정답의 '핵심 버전' 생성
    let rawAnswers = real.split('/').map(ans => ans.trim());
    let possibleAnswers = [];

    rawAnswers.forEach(ans => {
        const cAns = clean(ans);
        // 괄호가 있다면 괄호 제거 버전, 전체 버전, 괄호 안 버전 모두 추가
        if (cAns.includes('(') || cAns.includes(')')) {
            const mainPart = cAns.replace(/\s*\([^)]*\)/g, "").trim();
            const fullPart = cAns.replace(/[()]/g, "").trim();
            possibleAnswers.push(mainPart, fullPart);
        } else {
            possibleAnswers.push(cAns);
        }
    });

    // 2. 요구 정답 개수 파악
    let requiredCount = 1;
    if (qLower.includes("three")) requiredCount = 3;
    else if (qLower.includes("two")) requiredCount = 2;

    // 3. 스마트 매칭 (부분 일치 허용)
    let foundCount = 0;
    let tempUserAns = userClean;

    // 긴 정답 후보부터 대조 (정확도 향상)
    const sortedAnswers = [...new Set(possibleAnswers)].sort((a, b) => b.length - a.length);

    sortedAnswers.forEach(target => {
        if (target.length < 2) return; // 너무 짧은 단어는 무시

        // 사용자가 정답의 핵심을 포함하고 있거나 (예: "So one part does not...")
        // 정답 후보가 사용자의 입력을 포함하고 있는 경우 (예: "22nd Amendment" vs "22nd")
        if (tempUserAns.includes(target) || target.includes(tempUserAns)) {
            foundCount++;
            // 찾은 부분은 제거하여 중복 카운트 방지
            tempUserAns = tempUserAns.replace(target, " ");
        }
    });

    // 숫자 변환 체크 (예: 27 vs twenty-seven)
    if (foundCount < requiredCount) {
        for (let num in numMap) {
            if (userClean.includes(num) || userClean.includes(numMap[num])) {
                if (possibleAnswers.some(a => a.includes(num) || a.includes(numMap[num]))) {
                    foundCount++;
                }
            }
        }
    }

    return foundCount >= requiredCount;
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