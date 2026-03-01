// Standard API response format
export class ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    timestamp: string;

    constructor(data: T, message = 'Success', success = true) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.timestamp = new Date().toISOString();
    }

    static ok<T>(data: T, message = 'Success') {
        return new ApiResponse(data, message, true);
    }

    static error(message: string) {
        return new ApiResponse(null, message, false);
    }

    static paginated<T>(data: T[], total: number, page: number, limit: number, message = 'Success') {
        return {
            success: true,
            data,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            message,
            timestamp: new Date().toISOString(),
        };
    }
}
