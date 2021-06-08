export abstract class PasswordRepromptService {
    protectedFields: () => string[];
    showPasswordPrompt: () => Promise<boolean>;
}
