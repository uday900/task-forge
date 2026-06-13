// helper function

export function getInitials(name) {
  if (!name || !name.trim()) {
    return '--'; // empty fallback
  }

  const words = name.trim().split(' ');

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return (
    words[0][0] + words[1][0]
  ).toUpperCase();
}