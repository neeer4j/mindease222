// Simple profanity and inappropriate content detection
const inappropriateWords = [
    'profanity', 'abuse', 'hate', 'racist', 'offensive'
    // Add more words as needed
];

export const detectInappropriateContent = (text) => {
    const lowerText = text.toLowerCase();
    return inappropriateWords.some(word => lowerText.includes(word));
};

export const moderateMessage = (text) => {
    const isInappropriate = detectInappropriateContent(text);
    return {
        isAppropriate: !isInappropriate,
        message: text // You could implement message sanitization here if needed
    };
};