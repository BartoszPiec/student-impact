import { createBrowserClient } from "@supabase/ssr";

type CreateClientOptions = {
    rememberSession?: boolean;
};

export function createClient(options: CreateClientOptions = {}) {
    const hasRememberPreference = Object.prototype.hasOwnProperty.call(options, "rememberSession");
    const rememberSession = options.rememberSession ?? true;

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            isSingleton: !hasRememberPreference,
            cookieOptions: rememberSession
                ? { maxAge: 60 * 60 * 24 * 30 }
                : {},
        }
    );
}
