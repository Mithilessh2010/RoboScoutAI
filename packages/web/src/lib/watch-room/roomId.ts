export function createRoomId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID().slice(0, 8);
    }

    return Math.random().toString(36).slice(2, 10);
}

export function createEntityId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
