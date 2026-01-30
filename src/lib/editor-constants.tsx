import { Facebook, Instagram, Linkedin, Youtube, Phone, Mail, MapPin, Globe, Star, Heart, Clock, Calendar, User, Building, X } from 'lucide-react';
import { WhatsAppIcon } from '@/components/WhatsAppIcon';

export const SOCIAL_ICONS = [
    { name: 'facebook', icon: Facebook, label: 'Facebook', color: '#1877F2' },
    { name: 'instagram', icon: Instagram, label: 'Instagram', color: '#E4405F' },
    { name: 'x', icon: X, label: 'X', color: '#000000' },
    { name: 'linkedin', icon: Linkedin, label: 'LinkedIn', color: '#0A66C2' },
    { name: 'youtube', icon: Youtube, label: 'YouTube', color: '#FF0000' },
    { name: 'whatsapp', icon: WhatsAppIcon, label: 'WhatsApp', color: '#25D366' },
];

export const GENERIC_ICONS = [
    { name: 'phone', icon: Phone, label: 'Phone' },
    { name: 'mail', icon: Mail, label: 'Email' },
    { name: 'location', icon: MapPin, label: 'Location' },
    { name: 'globe', icon: Globe, label: 'Website' },
    { name: 'star', icon: Star, label: 'Star' },
    { name: 'heart', icon: Heart, label: 'Heart' },
    { name: 'clock', icon: Clock, label: 'Clock' },
    { name: 'calendar', icon: Calendar, label: 'Calendar' },
    { name: 'user', icon: User, label: 'User' },
    { name: 'building', icon: Building, label: 'Building' },
];

export const EDITOR_SHAPES = ['rect', 'rect-sharp', 'circle', 'triangle', 'pentagon', 'hexagon', 'star', 'line', 'arrow', 'arrow-left', 'arrow-up', 'arrow-down', 'chevron'];
