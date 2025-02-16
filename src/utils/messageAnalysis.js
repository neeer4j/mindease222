// Message analysis utility functions

/**
 * Analyzes a message for potential violations
 * @param {Object} message - The message to analyze
 * @param {Array} previousMessages - Array of previous messages for context
 * @returns {Object} Analysis results including flag status and reasons
 */
export const analyzeMessage = (message, previousMessages = []) => {
    const analysis = {
        isFlagged: false,
        flagType: null,
        reasons: [],
        confidence: 0
    };

    // Check message content
    const content = message.content.toLowerCase();
    const violations = checkViolations(content);
    
    if (violations.length > 0) {
        analysis.isFlagged = true;
        analysis.flagType = violations[0].type;
        analysis.reasons = violations.map(v => v.reason);
        analysis.confidence = calculateConfidence(violations);
    }

    // Check for spam patterns
    if (previousMessages.length > 0) {
        const spamCheck = checkSpamPatterns(message, previousMessages);
        if (spamCheck.isSpam) {
            analysis.isFlagged = true;
            analysis.flagType = 'spam';
            analysis.reasons.push(spamCheck.reason);
            analysis.confidence = Math.max(analysis.confidence, spamCheck.confidence);
        }
    }

    return analysis;
};

/**
 * Determines if a message should be automatically moderated
 * @param {Object} analysis - The message analysis results
 * @returns {boolean}
 */
export const shouldAutoModerate = (analysis) => {
    return analysis.isFlagged && analysis.confidence >= 0.9;
};

/**
 * Gets the type of moderation needed based on analysis
 * @param {Object} analysis - The message analysis results
 * @returns {'auto_remove' | 'manual_review' | 'flag_only'}
 */
export const getModerationType = (analysis) => {
    if (!analysis.isFlagged) return null;
    
    if (analysis.confidence >= 0.9) {
        return 'auto_remove';
    } else if (analysis.confidence >= 0.7) {
        return 'manual_review';
    }
    return 'flag_only';
};

// Helper functions
const checkViolations = (content) => {
    const violations = [];
    
    // Add your content moderation rules here
    // Example rules:
    const rules = [
        {
            pattern: /\b(hate|violent|threat|death|kill)\b/i,
            type: 'hate_speech',
            reason: 'Potentially harmful content detected'
        },
        {
            pattern: /\b(http|www\.|\.com|\.net|\.org)\b/i,
            type: 'spam',
            reason: 'External links not allowed'
        }
        // Add more rules as needed
    ];

    rules.forEach(rule => {
        if (rule.pattern.test(content)) {
            violations.push({
                type: rule.type,
                reason: rule.reason,
                confidence: 0.8 // Base confidence, can be adjusted based on rule
            });
        }
    });

    return violations;
};

const checkSpamPatterns = (message, previousMessages) => {
    const result = {
        isSpam: false,
        reason: '',
        confidence: 0
    };

    // Check for message frequency
    const recentMessages = previousMessages.filter(msg => 
        msg.userId === message.userId &&
        msg.timestamp >= Date.now() - 60000 // Messages in last minute
    );

    if (recentMessages.length >= 5) {
        result.isSpam = true;
        result.reason = 'Too many messages in short time';
        result.confidence = 0.95;
    }

    // Check for repeated content
    const duplicateContent = previousMessages.filter(msg =>
        msg.userId === message.userId &&
        msg.content === message.content
    );

    if (duplicateContent.length >= 2) {
        result.isSpam = true;
        result.reason = 'Repeated identical messages';
        result.confidence = 0.9;
    }

    return result;
};

const calculateConfidence = (violations) => {
    if (violations.length === 0) return 0;
    
    // Average the confidence scores of all violations
    const totalConfidence = violations.reduce((sum, v) => sum + v.confidence, 0);
    return totalConfidence / violations.length;
};