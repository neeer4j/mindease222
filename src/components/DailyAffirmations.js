// src/components/DailyAffirmations.js

const affirmations = [
  "I am capable and strong.",
  "I choose to be kind to myself today.",
  "I am grateful for all that I have.",
  "My thoughts are filled with positivity.",
  "I am at peace with who I am.",
  "I embrace challenges as opportunities to grow.",
  // ... add many more affirmations
];

let lastIndex = -1; // Keep track of the index of the last affirmation to avoid repetition

const DailyAffirmations = {
  /**
   * Returns a randomly selected affirmation from the list.
   * Ensures that if there's more than one affirmation, it won't return
   * the same one consecutively to provide variety.
   * @returns {string} A random affirmation string, or "No affirmation available." if the list is empty.
   */
  getRandomAffirmation: () => {
    if (affirmations.length === 0) {
      return "No affirmation available.";
    }

    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * affirmations.length);
    } while (randomIndex === lastIndex && affirmations.length > 1); // Ensure not the same as last if possible

    lastIndex = randomIndex; // Update last index to prevent immediate repetition
    return affirmations[randomIndex];
  },

  /**
   * Returns a new array containing all current affirmations.
   * This creates a copy to prevent accidental direct modification of the original array from outside.
   * @returns {string[]} An array of all affirmation strings.
   */
  getAllAffirmations: () => [...affirmations], // Use spread syntax to create a shallow copy

  /**
   * Adds a new affirmation to the list, but only if it's a valid, non-empty string.
   * Ignores leading/trailing whitespace.
   * @param {string} newAffirmation - The affirmation string to add.
   * @returns {boolean} True if the affirmation was successfully added, false otherwise.
   */
  addAffirmation: (newAffirmation) => {
    if (typeof newAffirmation === "string" && newAffirmation.trim().length > 0) {
      affirmations.push(newAffirmation.trim()); // Add the trimmed affirmation
      return true;
    }
    return false;
  },

  /**
   * Removes a specific affirmation from the list.
   * It removes the *first* occurrence of the given affirmation.
   * @param {string} affirmationToRemove - The exact affirmation string to remove.
   * @returns {boolean} True if the affirmation was found and removed, false otherwise.
   */
  removeAffirmation: (affirmationToRemove) => {
    const index = affirmations.indexOf(affirmationToRemove);
    if (index !== -1) {
      affirmations.splice(index, 1); // Remove the affirmation at the found index
      return true;
    }
    return false;
  },
};

export default DailyAffirmations;