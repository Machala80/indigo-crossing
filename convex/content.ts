// Shared by the app and the reminder emails, so both show the same daily dare.
export const DARES = [
  "Say no to one small thing today, kindly and without over-explaining.",
  "Notice the pattern in someone else today, and answer it with compassion instead of judgement.",
  "Speak your truth out loud three times, looking yourself in the eye in a mirror.",
  "Do the opposite of your pattern once today, even in the smallest way.",
  "Spend ten minutes in silence with your phone in another room.",
  "Write the old belief on paper. Underneath, in bigger letters, write your truth.",
  "Read “what it costs” out loud to yourself, slowly.",
  "Thank someone in your family line, living or not, for one thing they gave you.",
  "Catch the trigger before it fires and name it out loud: “There it is.”",
  "Tell one person something true you would normally keep hidden.",
  "Write three things your pattern protected you from, and thank it for its service.",
  "Fast from complaining for the whole day.",
  "Walk somewhere new for fifteen minutes and notice what you feel in your body.",
  "Forgive yourself, in writing, for one slip.",
  "Ask your witness one question about their own patterns, and just listen.",
  "Give away one thing that belongs to the old pattern.",
  "Go to bed at the time the person you are becoming would.",
  "Rest for one hour without doing anything useful, and without guilt.",
  "Do your practice before you check your phone.",
  "Write a short letter from your future self, forty days from now.",
  "Bless someone who once spoke the old belief over you. You don’t have to send it.",
];

/** Day number counted from 1 Jan 1970 for a calendar date (y, m 1-12, d). */
export function dayNumber(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}
export const dareForDay = (n: number) => DARES[((n % DARES.length) + DARES.length) % DARES.length];
