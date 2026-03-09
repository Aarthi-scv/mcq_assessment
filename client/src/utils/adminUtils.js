import axios from "axios";

export const getAdminHeaders = () => {
    const token = localStorage.getItem("adminToken");
    return { headers: { Authorization: `Bearer ${token}` } };
};

export const parseUploadedFile = (text) => {
    console.log('[Frontend Parser] Starting extraction, text length:', text.length);
    const questions = [];
    const chunks = text.split(/===QUESTION START===/i);

    chunks.forEach((chunk, index) => {
        if (!chunk.trim()) return;

        try {
            const contentParts = chunk.split(/===QUESTION END===/i);
            let cleanBlock = contentParts[0].trim();
            if (!cleanBlock) return;

            cleanBlock = cleanBlock.replace(/\u00A0/g, ' ');

            const optAStartMatch = cleanBlock.match(/(?:\s|^)[A][\.\)]/i);
            if (!optAStartMatch) {
                console.warn(`[Frontend Parser] Skipping block ${index}: No Option A marker found.`);
                return;
            }

            const aIndex = optAStartMatch.index;
            const aCharIndex = cleanBlock.indexOf(optAStartMatch[0].trim(), aIndex);

            let rawQnText = cleanBlock.substring(0, aCharIndex).trim();

            let codeSnippet = "";
            let questionType = "plain";

            const codeLabelMatch = rawQnText.match(/CODE:\s*([\s\S]*)/i);
            if (codeLabelMatch) {
                questionType = "code";
                codeSnippet = codeLabelMatch[1].trim();
                rawQnText = rawQnText.split(/CODE:/i)[0].trim();
            }

            let qnText = rawQnText.replace(/QUESTION:\s*/gi, '').trim();
            qnText = qnText.replace(/^\d+[\.\)]?\s*/, '');

            const getOpt = (letter, nextLetters) => {
                const nextSelector = `(?:\\s+${nextLetters}[\\.\\)]|\\s+Answer:)`;
                const regex = new RegExp(`${letter}[\\.\\)]\\s*([\\s\\S]*?)(?=${nextSelector})`, 'i');
                const match = cleanBlock.match(regex);
                return match ? match[1].trim() : "";
            };

            let valA = getOpt('A', '[B-D]');
            let valB = getOpt('B', '[C-D]');
            let valC = getOpt('C', 'D');
            const optDMatch = cleanBlock.match(/D[\.\)]\s*([\s\S]*?)(?=\s+Answer:)/i);
            let valD = optDMatch ? optDMatch[1].trim() : "";

            const stripLabels = (val) => val.replace(/^(?:OPTIONS|CODE|QUESTION):\s*/gi, '').trim();
            valA = stripLabels(valA); valB = stripLabels(valB); valC = stripLabels(valC); valD = stripLabels(valD);

            const answerMatch = cleanBlock.match(/Answer:\s*([A-D])/i);
            const answerLetter = answerMatch ? answerMatch[1].toUpperCase() : "A";

            const expMatch = cleanBlock.match(/Explanation:\s*([\s\S]*?)$/i);
            const explanation = expMatch ? expMatch[1].trim() : "";

            if (qnText && (valA || valB)) {
                questions.push({
                    qn: qnText,
                    codeSnippet: codeSnippet,
                    questionType: questionType,
                    optionType: "multiple",
                    optionA: valA,
                    optionB: valB,
                    optionC: valC,
                    optionD: valD,
                    correctAnswer: answerLetter,
                    explanation: explanation,
                });
            }
        } catch (err) {
            console.error('[Frontend Parser] Error in chunk:', err);
        }
    });

    return questions;
};

export const getModuleQuestions = (module) => {
    if (module.module?.quiz?.length > 0) {
        return module.module.quiz.map(q => ({
            _id: q._id,
            qn: q.qn,
            codeSnippet: q.codeSnippet || '',
            questionType: q.questionType || 'plain',
            options: q.options,
            answer: q.answer,
            correctAnswer: ['A', 'B', 'C', 'D'][q.options.indexOf(q.answer)] || 'A',
            explanation: q.explanation,
            questionImage: q.questionImage || null,
        }));
    }
    if (module.questions?.length > 0) {
        return module.questions.map(q => ({
            _id: q._id,
            qn: q.questionText,
            codeSnippet: q.codeSnippet || '',
            questionType: q.questionType || 'plain',
            options: [q.options?.A, q.options?.B, q.options?.C, q.options?.D],
            answer: q.correctValue,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            questionImage: q.questionImage || null,
        }));
    }
    return [];
};
