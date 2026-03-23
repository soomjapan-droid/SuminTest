// mastery.js

// 1. 저장된 맞힌 문제 ID 목록 가져오기
function getMasteredIds() {
    return JSON.parse(localStorage.getItem('masteredIds') || '[]');
}

// 2. 새로운 정답 ID 추가하기
function saveMasteredId(id) {
    let ids = getMasteredIds();
    if (!ids.includes(id)) {
        ids.push(id);
        localStorage.setItem('masteredIds', JSON.stringify(ids));
    }
}

// 3. 여러 개의 정답 ID 한꺼번에 추가하기 (시험 종료 시)
function saveMultipleMasteredIds(newIds) {
    let ids = getMasteredIds();
    let combined = [...new Set([...ids, ...newIds])];
    localStorage.setItem('masteredIds', JSON.stringify(combined));
}

// 4. 아직 안 푼 문제들만 필터링해서 가져오기
function getAvailableQuestions(allQuestions) {
    const masteredIds = getMasteredIds();
    return allQuestions.filter(q => !masteredIds.includes(q.id));
}

// 5. 전체 초기화
function resetAllProgress() {
    if (confirm("Reset all progress and start over?")) {
        localStorage.removeItem('masteredIds');
        return true;
    }
    return false;
}

// 6. 현재 달성도(%) 계산
function getMasteryStats(totalCount) {
    const masteredCount = getMasteredIds().length;
    return {
        count: masteredCount,
        percent: Math.round((masteredCount / totalCount) * 100)
    };
}