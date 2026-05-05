const colors = ['#2563eb', '#16a34a', '#f97316', '#dc2626', '#7c3aed', '#0891b2', '#be123c', '#4f46e5'];
const priorities = { urgent: 4, high: 3, medium: 2, low: 1 };

function todayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function isOverdue(task) {
  const deadline = parseDate(task.deadline);
  return deadline && !task.done && deadline < todayDate();
}

function overdueDays(task) {
  const deadline = parseDate(task.deadline);
  if (!deadline) return 0;
  return Math.max(1, Math.ceil((todayDate() - deadline) / 86400000));
}

function initials(name) {
  return (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function displayMemberName(member) {
  if (!member) return 'Unassigned';
  return member.id === 'me' ? `${member.name} (me)` : member.name;
}

function readFilesAsDataUrls(files) {
  return Promise.all(
    [...files].map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    )
  );
}

export { colors, priorities, todayDate, parseDate, isOverdue, overdueDays, initials, displayMemberName, readFilesAsDataUrls };
