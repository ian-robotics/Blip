// Based on tasks completed today, independently of food and fullness.
export const BLIP_WORDS = [
  { min: 0, max: 0, mood: 'Waiting', words: [
    'No snacks of progress yet. Shall we start small?',
    'My task tummy is rumbling. One tiny task?',
    'I’m ready when you are. Let’s wake this day up!'
  ] },
  { min: 1, max: 2, mood: 'Still hungry', words: [
    'A tiny taste! I’m still hungry for progress.',
    'Hmm… a little more? I believe in you!',
    'My task tummy says: nice start, room for more!'
  ] },
  { min: 3, max: 4, mood: 'Looking good', words: [
    'Now we’re getting somewhere. Nicely done!',
    'Three cheers for this progress. Keep your own pace!',
    'Okay, okay… that’s pretty good!'
  ] },
  { min: 5, max: 7, mood: 'Happy', words: [
    'That’s a lovely pile of done. I’m proud of us!',
    'My happy wiggle is officially activated!',
    'Look at you go! A little break is well earned.'
  ] },
  { min: 8, max: 11, mood: 'Excited', words: [
    'So much progress! My pixels can barely sit still!',
    'You’re on a roll. Remember to recharge, too!',
    'Today’s teamwork? Absolutely stellar!'
  ] },
  { min: 12, max: Infinity, mood: 'Amazed', words: [
    'An incredible day! Time for a royal rest?',
    'My tiny pixels are bursting with pride!',
    'You’ve done so much. Let’s celebrate and recharge!'
  ] }
];
