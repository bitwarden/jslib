export class ErrorResponse {
    message: string;
    validationErrors: { [key: string]: string[]; };
    statusCode: number;

    constructor(response: any, status: number, identityResponse?: boolean) {
        let errorModel = null;
        if (identityResponse && response && response.ErrorModel) {
            errorModel = response.ErrorModel;
        } else if (response) {
            errorModel = response;
        }

        if (errorModel) {
            this.message = errorModel.Message;
            this.validationErrors = errorModel.ValidationErrors;
        } else {
            if (status === 429) {
                this.message = 'Rate limit exceeded. Try again later.';
            }
        }
        this.statusCode = status;
    }

    getSingleMessage(): string {
        if (this.validationErrors == null) {
            return this.message;
        }
        for (const key in this.validationErrors) {
            if (!this.validationErrors.hasOwnProperty(key)) {
                continue;
            }
            if (this.validationErrors[key].length) {
                return this.validationErrors[key][0];
            }
        }
        return this.message;
    }

    getAllMessages(): string[] {
        const messages: string[] = [];
        if (this.validationErrors == null) {
            return messages;
        }
        for (const key in this.validationErrors) {
            if (!this.validationErrors.hasOwnProperty(key)) {
                continue;
            }
            this.validationErrors[key].forEach((item: string) => {
                let prefix = '';
                if (key.indexOf('[') > -1 && key.indexOf(']') > -1) {
                    const lastSep = key.lastIndexOf('.');
                    prefix = key.substr(0, lastSep > -1 ? lastSep : key.length) + ': ';
                }
                messages.push(prefix + item);
            });
        }
        return messages;
    }
}
