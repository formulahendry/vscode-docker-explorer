export class Constants {
    public static get LOGIN_URL(): string { return "https://hub.docker.com/v2/users/login"; }
    public static get REPOSITORY_URL(): string { return "https://hub.docker.com/v2/repositories"; }
    public static get PAGE_SIZE(): string { return "page_size=100"; }
}
