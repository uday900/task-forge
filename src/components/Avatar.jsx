// Avatar.jsx

import { useTasks } from '../context/TaskContext';
import { getInitials } from '../utils/fileUtils';

export default function Avatar({ name, size = 'md' }) {

    const { state } = useTasks();
    const avatarColors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-orange-500',
        'bg-pink-500',
        'bg-red-500',
        'bg-yellow-500',
        'bg-indigo-500',
        'bg-teal-500',
    ];

     function getInitials(name) {
        if (!name || !name.trim()) {
            return '--';
        }

        const words = name.trim().split(' ');

        if (words.length === 1) {
            return words[0].slice(0, 2).toUpperCase();
        }

        return (
            words[0][0] + words[1][0]
        ).toUpperCase();
    }

     function getAvatarColor(name) {
        if (!name) {
            return 'bg-gray-500';
        }

        let hash = 0;

        for (let i = 0; i < name.length; i++) {
            hash += name.charCodeAt(i);
        }

        return avatarColors[hash % avatarColors.length];
    }

    if (name === "You") {
        name = state.user.name;
    }
    return (
        <div
            className={`${size === 'sm' ? 'w-6 h-6 text-xs' : 'w-10 h-10 text-sm'} rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(name)}`}
        >
            {getInitials(name)}
        </div>
    );
}