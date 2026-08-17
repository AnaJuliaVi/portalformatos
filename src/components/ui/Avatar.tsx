import type { PortalUser } from '@/lib/supabase';
import { userInitials } from '@/lib/data';

interface AvatarProps {
  user: Pick<PortalUser, 'name' | 'email' | 'photo_url'> & { photo_url?: string | null };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

export default function Avatar({ user, size = 'md', className = '', ring = false }: AvatarProps) {
  const sizeClass = SIZES[size];
  const initials = userInitials(user);
  const ringClass = ring ? 'ring-2 ring-white shadow-soft' : '';

  if (user.photo_url) {
    return (
      <img
        src={user.photo_url}
        alt={user.name ?? user.email}
        loading="lazy"
        className={`${sizeClass} ${ringClass} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${ringClass} grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white ${className}`}
    >
      {initials}
    </div>
  );
}
