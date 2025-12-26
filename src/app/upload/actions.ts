'use server';

import { supabase } from '@/lib/supabase';

export async function uploadLogo(file: File) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('logos')
            .upload(filePath, file);

        if (uploadError) {
            return { success: false, error: uploadError.message };
        }

        const { data } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);

        return { success: true, url: data.publicUrl };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
