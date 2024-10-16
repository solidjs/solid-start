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
        <div class="flex flex-col gap-2 w-full max-w-md text-sm">
            {success && <p class="text-green-600">{success}</p>}
            {error && <p class="text-red-600">{error}</p>}
            {message && <p>{message}</p>}
        </div>
    );
}
