export type Message = { success?: string; error?: string; message?: string };

export function FormMessage({
    success,
    error,
    message
}: {
    success?: string;
    error?: string;
    message?: string;
}) {
    if (!success && !error && !message) return null;

    return (
        <div class={`flex flex-col gap-2 w-full max-w-md text-sm mb-4`}>
            {success && <p class="w-full p-2 border font-medium rounded bg-green-200 border-green-600 text-green-600">{success}</p>}
            {error && <p class="w-full p-2 border font-medium rounded bg-red-200 border-red-600 text-red-600">{error}</p>}
            {message && <p class="w-full p-2 border font-medium rounded border-slate-300">{message}</p>}
        </div>
    );
}
