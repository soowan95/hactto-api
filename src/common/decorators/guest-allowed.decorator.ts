import { SetMetadata } from '@nestjs/common';

export const IS_GUEST_ALLOWED_KEY = 'isGuestAllowed';
export const GuestAllowed = () => SetMetadata(IS_GUEST_ALLOWED_KEY, true);
