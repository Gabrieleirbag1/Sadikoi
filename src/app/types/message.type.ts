interface Message {
    id: number;
    content: string;
    sender: User;
    timestamp: string;
    /** The sender blocked the connected user: the API sent no content. */
    blocked_you?: boolean;
}